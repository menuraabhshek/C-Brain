function  DropBoxReqDecord(obj){
     var AcountType=obj["T"];
     if(AcountType=="U"){

     }else if(AcountType=="S"){
          CheckServiceProvider('HT',obj["X"],obj["O"],obj["PW"],function(veryfied,info){
               ReceveVerifideREQ(obj,veryfied,info)
          })
     }

}


function ReceveVerifideREQ(obj,veryfied,info){
     var metode=obj["M"]
     if(veryfied){
          if(metode=="TN_LK"){   // say need token link
               BringTokenLink(obj.X)
          }else if(metode=="PTN_LK"){   // say need token link
               UpdateTokenLink(obj.X,obj.L)
          }
     }     
}


function BringTokenLink(ID){
     RECE(Profi_url+"/DROPBOX_TOKEN_LINKS/"+ID,Profi_Secret,function(data){         
          Gosip.Sent(ID,data,"TN_LK");
     });
}

function UpdateTokenLink(ID,LinkArry){
     SEND("PUT",Profi_url+"/DROPBOX_TOKEN_LINKS/"+ID,Profi_Secret,LinkArry)
}