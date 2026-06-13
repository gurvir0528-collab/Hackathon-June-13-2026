import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const supabaseUrl = "https://nqlsjjplxjzeocppqrcg.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5xbHNqanBseGp6ZW9jcHBxcmNnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEzNTAzMjYsImV4cCI6MjA5NjkyNjMyNn0.pfrIau9H5l8TV5Ny0lt5ewgT3RJDxVp7AwYQceSqkpI"

const supabaseClient = createClient(supabaseUrl, supabaseKey);

async function updateCommand(command){
    const {error} = await supabaseClient
    .from("robot commands")
    .update({command: command})
    .eq("id", 1);

    if(error){
        alert(error.message);
        return;
    } 
}

document.addEventListener("DOMContentLoaded", () => {

  const loginBtn = document.getElementById("loginBtn");
  const signupBtn = document.getElementById("signupBtn");
  const intructionsBtn = document.getElementById("instructionsInput")

  loginBtn?.addEventListener("click", async () => {

    const email = document.getElementById("loginEmail").value;
    const password = document.getElementById("loginPassword").value;

    const { error } = await supabaseClient.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      alert(error.message);
    } else {
      alert("Login successful!");

      document.getElementById("loginEmail").value = "";
      document.getElementById("loginPassword").value = "";
    }
  });

  signupBtn?.addEventListener("click", async () => {

    const email = document.getElementById("signupEmail").value;
    const password = document.getElementById("signupPassword").value;

    const { error } = await supabaseClient.auth.signUp({
      email,
      password
    });

    if (error) {
      alert(error.message);
    } else {
      alert("Signup successful!");

      document.getElementById("signupEmail").value = "";
      document.getElementById("signupPassword").value = "";
    }
  });

intructionsBtn?.addEventListener("click", async () => {

    const instruction = document.getElementById("playInstructions").value.trim();

    if (!instruction.endsWith(";")) {
        alert("Command must end with ;");
        return;
    }

    let command = null;
    let value = null;

    if(instruction.toLowerCase().startsWith("move")){
        if(instruction.includes("steps")) {
            const nums = instruction.match(/-?\d+/g);
            if(!nums){
                alert("No Number Was Found")
                return;
            }
            value = parseInt(nums[0]);
            command = `move_${value}_steps`;
        }
    
     } else if (instruction.toLowerCase().startsWith("turn")) {

        if (instruction.includes("degree")) {

            const nums = instruction.match(/-?\d+/g);
            if (!nums) {
                alert("No number found!");
                return;
            }

            value = parseInt(nums[0]);
            command = `turn_${value}_degrees`;
        }

    }
    if (command === null) {
        alert("Invalid command format");
        return;
    }
    updateCommand(command);
    console.log("command =", command);
    console.log("value =", value);
    document.getElementById("playInstructions").value=""
    

    });
});
