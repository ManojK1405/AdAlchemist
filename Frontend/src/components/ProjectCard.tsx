import type React from "react"
import type { Project } from "../Types";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { Loader2Icon } from "lucide-react";

const ProjectCard = ({gen,setGenerations,forCommunity=false}:{gen:Project,setGenerations:React.Dispatch<React.SetStateAction<Project[]>>,forCommunity?:boolean}) => {

    const navigate = useNavigate();
    const [menuOpen,setMenuOpen] = useState(false);


  return (

    <div key={gen.id} className="mb-4 break-inside-avoid">
    <div className="bg-white/5 border border-white/10 rounded-x1 overflow-hidden hover:border-white/20 transition group">

        {/*preview image*/}
        <div className={`${gen?.aspectRatio === '9:16' ? 'aspect-9/16' : 'aspect-video'} relative overflow-hidden`}>
            {gen.generatedImage && (
            <img src={gen.generatedImage} alt={gen.productName} className={`absolute inset-0 w-full h-full object-cover transition duration-500 ${gen.generatedVideo ? 'group-hover:opacity-0' :'group-hover: scale-105'}`} />
            )}

            {gen.generatedVideo && (
            <video src={gen.generatedVideo} muted loop playsInline className="absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-100 transition duration-500" onMouseEnter={(e)=>e.currentTarget.play()}
            onMouseLeave={(e)=>e.currentTarget.pause()}/>
            )}

            {(!gen?. generatedImage && !gen?. generatedVideo)&&
            (<div className="absolute inset-0 w-full h-full flex flex-col items-center justify-center bg-black/20">
                <Loader2Icon className="size-7 animate-spin"/>
            </div>)
            }
        </div>

        {/*preview image*/}
        <div></div>

    </div>
    </div>
  )
}

export default ProjectCard




