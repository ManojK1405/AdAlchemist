import { useEffect, useState } from "react";
import type { Project } from "../Types";
import { dummyGenerations } from "../assets/assets";
import {
  ImageIcon,
  Loader2Icon,
  RefreshCwIcon,
  SparkleIcon,
  VideoIcon,
} from "lucide-react";
import { Link } from "react-router-dom";
import { GhostButton, PrimaryButton } from "../components/Buttons";

const Result = () => {
  const [project, setProjectData] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  // Fetch project
  const fetchProjectData = async () => {
    setLoading(true);

    setTimeout(() => {
      setProjectData(dummyGenerations[0]); // gen_1 (no video initially)
      setLoading(false);
    }, 1500);
  };

  // Simulate video generation
  const handleGenerateVideo = () => {
    if (!project) return;

    setIsGenerating(true);
  };

  useEffect(() => {
    fetchProjectData();
  }, []);

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

          <Link
            to="/generate"
            className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-5 py-3 rounded-xl text-white transition"
          >
            <RefreshCwIcon className="w-4 h-4" />
            <span className="hidden sm:block">New Generation</span>
          </Link>
        </header>

        {/* Grid Layout */}
        <div className="grid lg:grid-cols-3 gap-10">

          {/* Main Result Display */}
          <div className="lg:col-span-2">
            <div className="glass-panel p-3 rounded-3xl w-full">
              <div
                className={`${
                  project.aspectRatio === "9:16"
                    ? "aspect-[9/16]"
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

                <a href={project.generatedImage} download>
                  <GhostButton
                    disabled={!project.generatedImage}
                    className="w-full justify-center rounded-md py-3 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ImageIcon className="size-4" />
                    Download Image
                  </GhostButton>
                </a>

                <a href={project.generatedVideo} download>
                  <GhostButton
                    disabled={!project.generatedVideo}
                    className="w-full justify-center rounded-md py-3 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <VideoIcon className="size-4" />
                    Download Video
                  </GhostButton>
                </a>

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
