import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const supabaseUrl = "https://nqlsjjplxjzeocppqrcg.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5xbHNqanBseGp6ZW9jcHBxcmNnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEzNTAzMjYsImV4cCI6MjA5NjkyNjMyNn0.pfrIau9H5l8TV5Ny0lt5ewgT3RJDxVp7AwYQceSqkpI";

const supabaseClient = createClient(supabaseUrl, supabaseKey);


// ----------------------
// UPDATE ROBOT COMMAND
// ----------------------
async function updateCommand(command) {
    const { error } = await supabaseClient
        .from("robot commands")
        .update({ command })
        .eq("id", 1);

    if (error) {
        alert(error.message);
        return false;
    }

    return true;
}
//load leaderboard wtf

async function loadLeaderboard() {
    console.log("LOAD LEADERBOARD CALLED");
    const { data, error } = await supabaseClient
        .from("profile")
        .select("email, xp")
        .order("xp", { ascending: false });

    if (error) {
        console.log("Leaderboard error:", error);
        return;
    }

    const board = document.getElementById("leaderboard");
    if (!board) return;

    board.innerHTML = "";

    data.forEach((user, index) => {

        const row = document.createElement("div");

        row.style.padding = "8px";
        row.style.margin = "4px 0";
        row.style.background = "#f2f2f2";
        row.style.borderRadius = "8px";

        row.className = "row";

        row.innerHTML = `
            <span class="rank">${index + 1}. ${user.email}</span>
            <span class="xp">${user.xp} XP</span>
`;

        board.appendChild(row);
        console.log("LEADERBOARD DATA:", data);
        console.log("LEADERBOARD ERROR:", error);
    });
}


// ----------------------
// DOM READY
// ----------------------
document.addEventListener("DOMContentLoaded", () => {

    const loginBtn = document.getElementById("loginBtn");
    const signupBtn = document.getElementById("signupBtn");
    const instructionsBtn = document.getElementById("instructionsInput");


    // ----------------------
    // LOGIN
    // ----------------------
    loginBtn?.addEventListener("click", async () => {

        const email = document.getElementById("loginEmail").value;
        const password = document.getElementById("loginPassword").value;

        const { error } = await supabaseClient.auth.signInWithPassword({
            email,
            password
        });

        if (error) {
            alert(error.message);
            return;
        }

        alert("Login successful!");

        document.getElementById("loginEmail").value = "";
        document.getElementById("loginPassword").value = "";
    });


    // ----------------------
    // SIGNUP + PROFILE CREATION
    // ----------------------
    signupBtn?.addEventListener("click", async () => {

        const email = document.getElementById("signupEmail").value;
        const password = document.getElementById("signupPassword").value;

        const { data, error } = await supabaseClient.auth.signUp({
            email,
            password
        });

        if (error) {
            alert(error.message);
            return;
        }
        
        alert("Signup successful!");

        const user = data.user;
        console.log("USER:", user);
        if (user) {
            await supabaseClient
                .from("profile")
                .insert({
                    user_id: user.id,
                    email: email,
                    xp: 0
                });
        }

        document.getElementById("signupEmail").value = "";
        document.getElementById("signupPassword").value = "";
    });


    // ----------------------
    // ROBOT INSTRUCTIONS
    // ----------------------
    instructionsBtn?.addEventListener("click", async () => {

        const message = document.getElementById("message");
        const input = document.getElementById("playInstructions");

        if (!message || !input) return;

        message.textContent = "";

        const instruction = input.value.trim();

        if (!instruction.endsWith(";")) {
            alert("Command must end with ;");
            return;
        }

        let command = null;
        let value = null;

        if (instruction.toLowerCase().startsWith("moveforward(")) {

            const nums = instruction.match(/-?\d+/g);
            if (!nums) {
                alert("No number was found");
                return;
            }

            value = parseInt(nums[0]);
            command = `move_${value}`;
        }

        else if (instruction.toLowerCase().startsWith("turn(")) {

            const nums = instruction.match(/-?\d+/g);
            if (!nums) {
                alert("No number was found");
                return;
            }

            value = parseInt(nums[0]);
            command = `turn_${value}`;
        }

        if (!command) {
            alert("Invalid command format");
            return;
        }

        const success = await updateCommand(command);

        if (success) {
            console.log("command =", command);
            console.log("value =", value);

            input.value = "";
            message.textContent = "Successful!";
        }
    });
    loadLeaderboard();
});
