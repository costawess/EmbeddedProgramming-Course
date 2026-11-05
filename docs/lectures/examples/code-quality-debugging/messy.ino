void loop(){
int v=analogRead(36);
  if(v>2000){
digitalWrite(23,HIGH);
    }else{
 digitalWrite(23,LOW);}
      delay(50);}
