import { Outlet } from "react-router-dom"
import Sidebar from "../pages/sideBar"
import BackupButton from "../pages/backup/backup"

export default function SuperAdminLayout() {
  return (
<>
    <div dir="rtl" className="dashboard flex">

      <div className="min-h-screen bg-dark "> <Sidebar role={"superadmin"}/></div>

      <div className="content flex-1">
        <Outlet />
      </div>

             


  
    </div>
    <BackupButton/>


    

</>


  )
}
