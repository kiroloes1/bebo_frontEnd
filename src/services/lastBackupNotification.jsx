import api from "./api";

export async function isLastBackupValid(){
    try{
        const response = await api.get('/lastUpdate');
       const data=new Date(response.data.updatedAt)

       const updatedDate = new Date(data);
        const now = new Date();


        const diffMs = now - updatedDate;


        const diffDays = diffMs / (1000 * 60 * 60 * 24);

        if (diffDays 
            > 2) {
           return false
        } else {
          return true
        }
            }catch(err){
            console.log(err);
            return false;
            }

        }