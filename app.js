import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const supabaseUrl = "https://nqlsjjplxjzeocppqrcg.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5xbHNqanBseGp6ZW9jcHBxcmNnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEzNTAzMjYsImV4cCI6MjA5NjkyNjMyNn0.pfrIau9H5l8TV5Ny0lt5ewgT3RJDxVp7AwYQceSqkpI"

const supabaseClient = createClient(supabaseUrl, supabaseKey);

document.addEventListener("DOMContentLoaded", () => {

  const loginBtn = document.getElementById("loginBtn");
  const signupBtn = document.getElementById("signupBtn");

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

});