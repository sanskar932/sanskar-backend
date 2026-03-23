gsap.from("#title",{y:-100,opacity:0,duration:1});

function pay(){
window.location.href="upi://pay?pa=9696065037@pthdfc&pn=Sanskar&cu=INR";
}

function chat(){
window.open("https://wa.me/919696065037");
}

document.getElementById("form").addEventListener("submit",async(e)=>{
e.preventDefault();

await fetch("https://sanskar-backend-d8t9.onrender.com/api/leads",{
method:"POST",
headers:{"Content-Type":"application/json"},
body:JSON.stringify({
name:document.getElementById("name").value,
email:document.getElementById("email").value,
message:document.getElementById("message").value
})
});

alert("Lead Sent 🚀");
});