import { Loader2Icon } from "lucide-react"
import { useEffect } from "react"


const Loading = () => {

  useEffect(() => {
    // Simulate loading time
    setTimeout(() => {
      window.location.href = "/"; // Redirect to home page after loading
    }, 2000); // Adjust the duration as needed
  }, []);

  return (
      <div className="h-screen flex flex-col">
        <div className="flex items-center justify-center flex-1">
        <Loader2Icon className=' size-7 animate-spin text-indigo-200'/>
        </div>
      </div>
  )
}

export default Loading