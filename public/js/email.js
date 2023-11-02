// const { name } = require("ejs");
import emailjs from 'emailjs-com';

function sendMail() {
    const params = {
        name : document.getElementById("name").value ,
        email : document.getElementById("email").value ,
        subject : document.getElementById("subject").value ,
        message : document.getElementById("message").value
    };



const serviceID = "service_v67msm9" ;
const templateId = "template_roqx357";

emailjs.send(serviceID,templateId, params).then((res)=>{
    document.getElementById('name').value = "";
    document.getElementById('email').value = "";
    document.getElementById('subject').value = "";
    document.getElementById('message').value = "";
    console.log(res);
    alert('your message sent successfully');
}).catch((err) => console.log(err)); 


}
