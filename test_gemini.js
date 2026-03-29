const API_KEY = "AIzaSyAAP8O9cr9_9Ip_wW7XQpDawMZRNmreQys";
async function test() {
  const model = "gemini-3.1-flash-lite-preview";
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          { parts: [{ text: "Hello" }] }
        ]
      })
    }
  );
  console.log("Status:", response.status);
  console.log("Body:", await response.text());
}
test();
