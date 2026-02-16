import { useEffect, useState } from "react";
import type { Project } from "../Types";
import {
  Edit2Icon,
  ImageIcon,
  Loader2Icon,
  RefreshCwIcon,
  SparkleIcon,
  VideoIcon,
} from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { GhostButton, PrimaryButton } from "../components/Buttons";
import { useAuth, useUser } from "@clerk/clerk-react";
import api from "../configs/axios";
import { toast } from "react-hot-toast";

const Result = () => {

  const{projectId} = useParams();
  const {getToken} = useAuth();
  const {user,isLoaded} = useUser();
  const navigate = useNavigate();

  const [project, setProjectData] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  // Fetch project
  const fetchProjectData = async () => {
    try {
      const token = await getToken();
      const {data} = await api.get(`/api/project/${projectId}`,{
        headers:{
          Authorization: `Bearer ${token}`
        }
      });
      setProjectData(data);
      setIsGenerating(data.isGenerating);

      setLoading(false);

    } catch (error:any) {
      toast.error(error?.response?.data?.message || "Failed to load project data");
    }
  };

  // Simulate video generation
  const handleGenerateVideo = async () => {
  try {
    setIsGenerating(true);

    const token = await getToken();

    const { data } = await api.post(
      `/api/project/video`,
      { projectId },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    setProjectData(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        generatedVideo: data.videoUrl,
        isGenerating: false
      };
    });

    toast.success("Video generated successfully!");
    setIsGenerating(false);

  } catch (error: any) {
    toast.error(error?.response?.data?.message || "Failed to generate video");
    setIsGenerating(false);
  }
};


  useEffect(() => {
  if (!isLoaded) return;

  if (!user) {
    navigate("/");
    return;
  }

  if (!project?.id) {
    fetchProjectData();
  }
}, [user, isLoaded, project?.id]);

  //fetch project every 10 seconds to check for video generation status
  useEffect(() => {
    if (!user || !isGenerating) return;

    const interval = setInterval(() => {
      fetchProjectData();
    }, 10000);

    return () => clearInterval(interval);
  }, [user,isGenerating]);



  //Helper Function
  const handleDownload = async (url: string, filename: string): Promise<void> => {
      try {
        const response = await fetch(url);
        const blob = await response.blob();

        const link = document.createElement("a");
        link.href = window.URL.createObjectURL(blob);
        link.download = filename;
        link.click();
      } catch (err) {
        console.error("Download failed", err);
      }
  };




  // Loading Screen
  if (loading || !project) {
    return (
      <div className="h-screen w-full flex items-center justify-center">
        <Loader2Icon className="animate-spin text-indigo-400 size-9" />
      </div>
    );
  }

  return (
    <div className="min-h-screen text-white p-6 md:p-12 mt-20">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <header className="flex justify-between items-center mb-8">
          <h1 className="text-2xl md:text-3xl font-medium">
            Generation Result
          </h1>

          <div className="flex gap-3">
            <Link
              to="/editGeneration"
              className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-5 py-3 rounded-xl text-white transition"
            >
              <Edit2Icon className="w-4 h-4" />
              <span className="hidden sm:block">Edit Generation</span>
            </Link>

            <Link
              to="/generate"
              className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-5 py-3 rounded-xl text-white transition"
            >
              <RefreshCwIcon className="w-4 h-4" />
              <span className="hidden sm:block">New Generation</span>
            </Link>
          </div>
        </header>


        {/* Grid Layout */}
        <div className="grid lg:grid-cols-3 gap-10">

          {/* Main Result Display */}
          <div className="lg:col-span-2">
            <div className="glass-panel p-3 rounded-3xl w-full">
              <div
                className={`${
                  project.aspectRatio === "9:16"
                    ? "aspect-9/16"
                    : "aspect-video"
                } w-full rounded-2xl overflow-hidden bg-gray-900`}
              >
                {project.generatedVideo ? (
                  <video
                    src={project.generatedVideo}
                    controls
                    autoPlay
                    loop
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <img
                    src={project.generatedImage}
                    alt="Generated Result"
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">

            {/* Download Section */}
            <div className="glass-panel p-6 rounded-2xl">
              <h3 className="text-xl font-semibold mb-4">Actions</h3>

              <div className="flex flex-col gap-3">

                  <GhostButton
                    onClick={() =>
                      handleDownload(project?.generatedImage!, `image-${project?.id}.jpg`)
                    }
                    disabled={!project?.generatedImage}
                    className="w-full justify-center rounded-md py-3 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ImageIcon className="size-4" />
                    Download Image
                  </GhostButton>


                  <GhostButton
                    onClick={() => handleDownload(project?.generatedVideo!, `video-${project?.id}.mp4`)}
                    disabled={!project?.generatedVideo || project?.generatedVideo.trim() === ""}
                    className="w-full justify-center rounded-md py-3 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <VideoIcon className="size-4" />
                    Download Video
                  </GhostButton>



              </div>
            </div>

            {/* Video Magic Section */}
            <div className="glass-panel p-6 rounded-2xl relative">

              <div className="absolute top-0 right-0 p-4 opacity-10">
                <VideoIcon className="size-24" />
              </div>

              <h3 className="text-xl font-semibold mb-2">
                Video Magic
              </h3>

              <p className="text-gray-400 text-sm mb-6">
                Turn this static image into a dynamic video for social media.
              </p>

              {isGenerating ? (
                <PrimaryButton disabled className="w-full justify-center">
                  <Loader2Icon className="size-4 animate-spin" />
                  Generating Video...
                </PrimaryButton>
              ) : !project.generatedVideo ? (
                <PrimaryButton
                  onClick={handleGenerateVideo}
                  className="w-full justify-center"
                >
                  <SparkleIcon className="size-4" />
                  Generate Video
                </PrimaryButton>
              ) : (
                <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-xl text-green-400 text-center text-sm font-medium">
                  Video Generated Successfully!
                </div>
              )}

            </div>

          </div>
        </div>

      </div>
    </div>
  );
};

export default Result;
