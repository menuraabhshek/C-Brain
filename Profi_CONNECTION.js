var Profi_url="https://cyloprofi-default-rtdb.firebaseio.com";
var Profi_Secret="z81UHI1GvIKkvOvlHVgKCuLNa1nFTfdFcpcweTc2";
var Profi_Conneted=false;


function Test_Profi(){
     Profi_Conneted=false;
     SetUNI_CON_ST("B","Discussing...","PROFI");
     if(Profi_url==""){
          SetUNI_CON_ST("R","Error","PROFI"); 
          SetNotifi("R",'Enter Firebase (Profile) URL');
          return;   
     }
     if(Profi_Secret==""){
          SetUNI_CON_ST("Y","Auth Error","PROFI"); 
          SetNotifi("Y",'Enter Firebase (Profile) Secrect');
          return;   
     }
     SEND("PUT",Profi_url+"/A",Profi_Secret,ACOD,function(Data){
          if(Data==ACOD){
               SetNotifi("G",'Connected to Firebase');   
               SetUNI_CON_ST("G","Connected","PROFI"); 
               Profi_Conneted=true;
          }else{
               SetNotifi("R",Data.error);   
               SetUNI_CON_ST("R","Error","PROFI"); 
          }
          
     })
} 