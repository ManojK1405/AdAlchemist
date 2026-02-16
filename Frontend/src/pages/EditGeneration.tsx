import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Loader2Icon, ArrowLeftIcon } from "lucide-react";
import { useAuth } from "@clerk/clerk-react";
import api from "../configs/axios";
import { toast } from "react-hot-toast";

const EditGeneration = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { getToken } = useAuth();

  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);
  const [project, setProject] = useState<any>(null);

  const [editMode, setEditMode] = useState<"image" | "video">("image");

  const [form, setForm] = useState({
    productName: "",
    productDescription: "",
    userPrompt: "",
    aspectRatio: "9:16",
  });

  // Fetch project
  const fetchProject = async () => {
    try {
      const token = await getToken();
      const { data } = await api.get(`/api/project/${projectId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setProject(data);

      setForm({
        productName: data.productName || "",
        productDescription: data.productDescription || "",
        userPrompt: data.userPrompt || "",
        aspectRatio: data.aspectRatio || "9:16",
      });

      setLoading(false);
    } catch (error: any) {
      toast.error("Failed to load project");
      navigate("/");
    }
  };

  useEffect(() => {
    if (projectId) fetchProject();
  }, [projectId]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleRegenerate = async () => {
    try {
      setRegenerating(true);
      const token = await getToken();

      if (editMode === "image") {
        await api.post(
          `/api/project/${projectId}/edit`,
          form,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        toast.success("Image regenerated successfully");
      }

      if (editMode === "video") {
        await api.post(
          `/api/project/edit-video`,
          {
            projectId,
            userPrompt: form.userPrompt,
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        toast.success("Video regeneration started");
      }

      navigate(`/result/${projectId}`);

    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "Regeneration failed"
      );
    } finally {
      setRegenerating(false);
    }
  };

  if (loading || !project) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2Icon className="animate-spin size-8 text-indigo-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen text-white p-6 md:p-10 mt-16">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <button
            onClick={() => navigate(`/result/${projectId}`)}
            className="flex items-center gap-2 text-gray-400 hover:text-white"
          >
            <ArrowLeftIcon className="size-4" />
            Back to Result
          </button>

          <h1 className="text-2xl font-semibold">
            Edit Studio
          </h1>

          <div className="text-sm text-gray-400">
            Cost: {editMode === "image" ? "5" : "20"} Credits
          </div>
        </div>

        {/* Toggle (only if video exists) */}
        {project.generatedVideo && (
          <div className="flex justify-center mb-8">
            <div className="bg-white/5 rounded-xl p-1 flex">
              <button
                onClick={() => setEditMode("image")}
                className={`px-4 py-2 rounded-lg transition ${
                  editMode === "image"
                    ? "bg-indigo-600 text-white"
                    : "text-gray-400"
                }`}
              >
                Edit Image
              </button>

              <button
                onClick={() => setEditMode("video")}
                className={`px-4 py-2 rounded-lg transition ${
                  editMode === "video"
                    ? "bg-indigo-600 text-white"
                    : "text-gray-400"
                }`}
              >
                Edit Video
              </button>
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-10">

          {/* LEFT SIDE: Preview */}
          <div className="lg:col-span-2">
            <div className="relative rounded-3xl overflow-hidden border border-white/10">

              {regenerating && (
                <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-10">
                  <Loader2Icon className="animate-spin size-10 text-indigo-400" />
                </div>
              )}

              {editMode === "video" && project.generatedVideo ? (
                <video
                  src={project.generatedVideo}
                  controls
                  className="w-full h-full object-cover"
                />
              ) : (
                <img
                  src={project.generatedImage}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              )}
            </div>
          </div>

          {/* RIGHT SIDE: Controls */}
          <div className="space-y-5">

            <input
              name="productName"
              value={form.productName}
              onChange={handleChange}
              placeholder="Product Name"
              className="w-full p-3 rounded-xl bg-white/5 border border-white/10"
            />

            <textarea
              name="productDescription"
              value={form.productDescription}
              onChange={handleChange}
              placeholder="Product Description"
              className="w-full p-3 rounded-xl bg-white/5 border border-white/10"
            />

            <textarea
              name="userPrompt"
              value={form.userPrompt}
              onChange={handleChange}
              placeholder={
                editMode === "video"
                  ? "Describe motion, camera movement, energy..."
                  : "Describe creative direction..."
              }
              className="w-full p-3 rounded-xl bg-white/5 border border-white/10"
            />

            {editMode === "image" && (
              <select
                name="aspectRatio"
                value={form.aspectRatio}
                onChange={handleChange}
                className="w-full p-3 rounded-xl bg-white/5 border border-white/10"
              >
                <option value="9:16">9:16 - Reels</option>
                <option value="1:1">1:1 - Instagram</option>
                <option value="16:9">16:9 - YouTube</option>
              </select>
            )}

            <button
              onClick={handleRegenerate}
              disabled={regenerating}
              className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 transition flex items-center justify-center gap-2"
            >
              {regenerating && (
                <Loader2Icon className="animate-spin size-4" />
              )}
              {editMode === "image"
                ? "Regenerate Image"
                : "Regenerate Video"}
            </button>

            <p className="text-xs text-gray-400 text-center">
              {editMode === "image"
                ? "Image regeneration will consume 5 credits."
                : "Video regeneration will consume 20 credits."}
            </p>

          </div>
        </div>
      </div>
    </div>
  );
};

export default EditGeneration;
