import { useState } from "react"
import { Loader2 } from "lucide-react"
import Title from "../components/Title"
import UploadZone from "../components/UploadZone"
import { useAuth, useUser } from "@clerk/clerk-react"
import { useNavigate } from "react-router-dom"
import { toast } from "react-hot-toast/headless"
import api from "../configs/axios"

const Generator = () => {

  const {user} = useUser()
  const {getToken} = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('')
  const [productName, setProductName] = useState('')
  const [productDescription, setProductDescription] = useState('')
  const [aspectRatio, setAspectRatio] = useState<'9:16' | '16:9'>('9:16')
  const [productImage, setProductImage] = useState<File | null>(null)
  const [modelImage, setModelImage] = useState<File | null>(null)
  const [userPrompt, setUserPrompt] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: 'product' | 'model'
  ) => {
    if (e.target.files && e.target.files[0]) {
      if (type === 'product') setProductImage(e.target.files[0])
      else setModelImage(e.target.files[0])
    }
  }

  const handleGenerate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if(!user){
      return toast("Please sign in to generate images")
    }

    if(!productImage || !modelImage || !name || !productName|| !aspectRatio){
      return toast("Please fill in all required fields")
    }

    try {
      setIsGenerating(true);
      
      const formData = new FormData();
      formData.append('name', name);
      formData.append('productName', productName);
      formData.append('productDescription', productDescription);
      formData.append('aspectRatio', aspectRatio);
      formData.append('userPrompt', userPrompt);
      formData.append('images', productImage);
      formData.append('images', modelImage);

      const token = await getToken();

      const {data} = await api.post('/api/project/create',formData,{
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      toast("Project created successfully");
      navigate(`/result/${data.projectId}`);

    } catch (error) {
      setIsGenerating(false);
      toast("Failed to generate project") 
    }

  }

  return (
    <div className="min-h-screen text-white p-6 md:p-12 mt-28">
      <form onSubmit={handleGenerate} className="max-w-6xl mx-auto space-y-12">

        <Title
          heading="Create In-Context Image"
          description="Upload your model and product images to generate stunning UGC, short-form videos and social media posts"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">

          {/* LEFT SIDE */}
          <div className="flex flex-col gap-8 ">
            <UploadZone
              label="Product Image"
              file={productImage}
              onClear={() => setProductImage(null)}
              onChange={(e) => handleFileChange(e, 'product')}
            />

            <UploadZone
              label="Model Image"
              file={modelImage}
              onClear={() => setModelImage(null)}
              onChange={(e) => handleFileChange(e, 'model')}
            />
          </div>

          {/* RIGHT SIDE */}
          <div className="space-y-6">

            {/* Project Name */}
            <div>
              <label className="block text-sm mb-2">Project Name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                type="text"
                placeholder="Name your project"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 focus:outline-none focus:border-violet-500"
              />
            </div>

            {/* Product Name */}
            <div>
              <label className="block text-sm mb-2">Product Name</label>
              <input
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                type="text"
                placeholder="Enter the name of the product"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 focus:outline-none focus:border-violet-500"
              />
            </div>

            {/* Product Description */}
            <div>
              <label className="block text-sm mb-2">
                Product Description <span className="text-gray-400">(optional)</span>
              </label>
              <textarea
                value={productDescription}
                onChange={(e) => setProductDescription(e.target.value)}
                rows={4}
                placeholder="Enter the description of the product"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 resize-none focus:outline-none focus:border-violet-500"
              />
            </div>

            {/* Aspect Ratio */}
            <div>
              <label className="block text-sm mb-3">Aspect Ratio</label>
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setAspectRatio('9:16')}
                  className={`h-14 w-12 rounded-lg border flex items-center justify-center transition ${
                    aspectRatio === '9:16'
                      ? 'border-violet-500 bg-violet-500/10'
                      : 'border-white/10 hover:border-violet-500/40'
                  }`}
                >
                  <div className="h-8 w-4 border border-white/50 rounded-sm" />
                </button>

                <button
                  type="button"
                  onClick={() => setAspectRatio('16:9')}
                  className={`h-14 w-16 rounded-lg border flex items-center justify-center transition ${
                    aspectRatio === '16:9'
                      ? 'border-violet-500 bg-violet-500/10'
                      : 'border-white/10 hover:border-violet-500/40'
                  }`}
                >
                  <div className="h-4 w-8 border border-white/50 rounded-sm" />
                </button>
              </div>
            </div>

            {/* User Prompt */}
            <div>
              <label className="block text-sm mb-2">
                User Prompt <span className="text-gray-400">(optional)</span>
              </label>
              <textarea
                value={userPrompt}
                onChange={(e) => setUserPrompt(e.target.value)}
                rows={3}
                placeholder="Describe how you want the narration to be."
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 resize-none focus:outline-none focus:border-violet-500"
              />
            </div>

          </div>
        </div>

        {/* GENERATE BUTTON */}
        <div className="flex justify-center pt-6">
          <button
            type="submit"
            disabled={isGenerating}
            className="px-12 py-4 rounded-xl bg-linear-to-r from-indigo-500 to-violet-600 font-semibold flex items-center gap-3 disabled:opacity-60"
          >
            {isGenerating ? (
              <>
                <Loader2 className="animate-spin h-5 w-5" />
                Generating...
              </>
            ) : user ? (
              <>Generate Image</>
            ) : (
              <>Sign In To Generate</>
            )}
          </button>
        </div>


      </form>
    </div>
  )
}

export default Generator
