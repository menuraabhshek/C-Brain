function DecordComment(obj) {
     VeryfiUser(obj["X"], obj['PW'].replace("PW", ''), obj['O'], false, function (verifide, data) {
          if (verifide) {
               if (obj["E"] == "NEW") {
                    if ("N" in data) {
                         AddNewComment(obj, "PRO" in data, data["N"], data["DP"]);
                    } else {
                         Gosip.Sent(obj["X"], '', "NONAM");
                    }

               } else if (obj["E"] == "DEL") {
                    RemoverComent(obj)
               } else if (obj["E"] == "EDT") {
                    EditeComent(obj)
               }
          } else {
               SEND("POST", UNI_Url + "/ACK/" + obj["U"], "", { "T": 'R', E: "Authentication failed!" });   ///R= tell you are reject
          }
     });
}



function AddNewComment(obj, ispro, name, dp) {
     var CommentBoddy = [
          dp,
          name,
          obj["C"],
          getCurrentdate(),
          obj["X"],
     ]
     if (ispro) { CommentBoddy[5] = 1 }
     var DBURL = obj["M"] == "L" ? "https://cylodata-default-rtdb.firebaseio.com/Comments/" : "https://cylodata-default-rtdb.firebaseio.com/SERVICEANG/COM/"
     var locationName=obj["M"] == "L" ?Get_Location_Data(obj["ID"], "NAME"):"service"
     SEND("POST", DBURL + obj["ID"], Dati_Secret, CommentBoddy, function (postdata) {
          if ("name" in postdata) {
               Gosip.Sent(obj["X"], { O: obj["X"], C: obj["C"], I: postdata["name"] }, "ACS");
               SendUserActivitiLog(obj["X"], "COM", `You Commented to ${locationName}`);
          } else {
               SEND("POST", UNI_Url + "/ACK/" + obj["U"], "", { "T": 'E', E: "Acknowledgement Error! (Don/'t worry it/'s a server side issue)" });
          }
     })

     


     Atant(`${name} added a new comment to ${locationName}`);
}

function RemoverComent(obj) {
     var DBURL = obj["M"] == "L" ? "https://cylodata-default-rtdb.firebaseio.com/Comments/" : "https://cylodata-default-rtdb.firebaseio.com/SERVICEANG/COM/"

     RECE(DBURL + obj["ID"] + '/' + obj["R"], Dati_Secret, function (comentInfo) {
          if (comentInfo[4] == obj["X"]) {
               SEND("DELETE", DBURL + obj["ID"] + '/' + obj["R"], Dati_Secret, '');
               Gosip.Sent(obj["X"], obj["R"], "RCS");
          }

     });
}

function EditeComent(obj) {
     var DBURL = obj["M"] == "L" ? "https://cylodata-default-rtdb.firebaseio.com/Comments/" : "https://cylodata-default-rtdb.firebaseio.com/SERVICEANG/COM/"

     RECE(DBURL + obj["ID"] + '/' + obj["R"], Dati_Secret, function (comentInfo) {
          if (comentInfo[4] == obj["X"]) {
               SEND("PUT", DBURL + obj["ID"] + '/' + obj["R"] + '/2', Dati_Secret, obj["C"]);
               Gosip.Sent(obj["X"], { O: obj["X"], C: obj["C"], I: obj["R"] }, "ECS");
          }
     });
}






/////////////////////////     Rating Haddler    /////////////////////////////////////////
function DecordRating(obj) {
     VeryfiUser(obj["X"], obj['PW'], obj['O'], false, function (verifide) {
          if (verifide) {
               var state = obj["R"]      //methode
               var Rate = null;
               if (state == 1) { Rate = 1; }
               if (state == -1) { Rate = 0; }

               obj["M"] = obj["M"] || "L";
               var DBURL = obj["M"] == "L" ? "https://cylodata-default-rtdb.firebaseio.com/RETING/" : "https://cylodata-default-rtdb.firebaseio.com/SERVICEANG/RATING/"
               var locationName=obj["M"] == "L" ?Get_Location_Data(obj["L"], "NAME"):"service"
               SEND("PUT", DBURL + obj["L"] + "/" + obj["X"], Dati_Secret, Rate, function (postdata) {
                    Gosip.Sent(obj["X"], "OK", "ARS");
                    postdata == null ? SendUserActivitiLog(obj["X"], "RATE", `You Removed Your Rating From ${locationName}`) : SendUserActivitiLog(obj["X"], "RATE", `You ${postdata == 1 ? "Liked" : "Disliked"} to ${locationName}`);
               });
          }
     })
}