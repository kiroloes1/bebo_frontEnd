
import { jwtDecode } from "jwt-decode";  
import { Navigate } from "react-router-dom";

 function isAccess(role){
 

    const token=localStorage.getItem("token");
     if (!token) return false;
     try{

            const decoded=jwtDecode(token);
            if(decoded.role==role){
                return true;
            }else{

                return false;
            } 

     }catch{
           return false;
     }

}

function ProtectedAccess({ children ,role}) {
  const tokenValid = isAccess(role);
  if (!tokenValid) return <Navigate to="/login" />;
  return children;
}

export default ProtectedAccess;

