import { Outlet } from "react-router-dom"
import Sidebar from "../pages/sideBar"

export default function ManagerLayout() {
  return (
    <div dir="rtl" className="dashboard flex">
   
      <aside className="min-h-screen"><Sidebar role={"manager"}/></aside>

       <div className="content  flex-1">
        <Outlet />
      </div>


    </div>
  )
}
