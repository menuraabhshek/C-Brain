var Dati_url="https://cylodata-default-rtdb.firebaseio.com";
var Dati_Secret="3DBnCLnO85QBjMHSsznxY2AUPLQSXt8dK3HHCPz7";
var Dati_Conneted=false;


function Test_Dati(){
     Dati_Conneted=false;
     SetUNI_CON_ST("B","Discussing...","DATI");
     if(Dati_url==""){
          SetUNI_CON_ST("R","Error","DATI"); 
          SetNotifi("R",'Enter Firebase (Data) URL');
          return;   
     }
     if(Dati_Secret==""){
          SetUNI_CON_ST("Y","Auth Error","DATI"); 
          SetNotifi("Y",'Enter Firebase (Data) Secrect');
          return;   
     }
     SEND("PUT",Dati_url+"/A",Dati_Secret,ACOD,function(Data){
          if(Data==ACOD){
               SetNotifi("G",'Connected to Firebase');   
               SetUNI_CON_ST("G","Connected","DATI"); 
               Dati_Conneted=true;
          }else{
               SetNotifi("R",Data.error);   
               SetUNI_CON_ST("R","Error","DATI"); 
          }
          
     });     
}




//////////////////////////////    Sync Locations   ////////////////////////////////////////////
var fullLocation={};

function ADVStart(){
     fullLocation=JSON.parse(localStorage.getItem("ADVSYNC"));
     fullLocation==null?{}:fullLocation;
     SetUNI_CON_ST("Y","LOCAL","Sync"); 
     return "Adventhures Geted from local"
}



function GrabOptiLocations(){
     SetUNI_CON_ST("B","SYNCING.....","Sync"); 
     RECE(Dati_url+'/Place_Optimizer',"",function(Locatoins){
          fullLocation={};
          Object.values(Locatoins).forEach(function(Place){
               fullLocation=Object.assign(fullLocation,Place);
          });
          localStorage.setItem("ADVSYNC",JSON.stringify(fullLocation));
          SetUNI_CON_ST("G","CLOUD","Sync"); 
          console.log("Adventhures Geted from cloud");
     })
     OnlineServises.fetchRegistry();
}

function Get_Location_Data(id,dataKey){
     var data=fullLocation[id]||{};
     return data[dataKey] || null;
}