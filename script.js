import { getDailyPanchang } from "https://esm.sh/panchang-ts";

const TITHI_GU = [
    "પડવો", "બીજ", "ત્રીજ", "ચોથ", "પાંચમ",
    "છઠ", "સાતમ", "આઠમ", "નવમી", "દશમી",
    "અગિયારસ", "બારસ", "તેરસ", "ચૌદસ", "પૂનમ"
];

const PAKSHA_GU = {
    shukla: "સુદ",
    krishna: "વદ"
};

async function generateSuvichar(specialDay) {
    const prompt = specialDay
        ? `Write one short, original Gujarati "suvichar" (thought of the day) related to ${specialDay}. Write only in Gujarati script, 1 line, no English, no explanation, no quotes around it.`
        : `Write one short, original Gujarati "suvichar" (general thought of the day) for daily inspiration. Write only in Gujarati script, 1 line, no English, no explanation, no quotes around it.`;

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
            "Authorization": "Bearer yourownapikey", "Content-Type": "application/json"
        },
        body: JSON.stringify({
            model: "anthropic/claude-sonnet-5",
            messages: [{ role: "user", content: prompt }]
        })
    });

    const data = await response.json();

    if (!data.choices) {
        return "⚠️ Error: " + (data.error?.message || "Unknown error");
    }

    return data.choices[0].message.content.trim();
}

async function translateFestivalToGujarati(text) {
    if (!text) return "";

    const prompt = `
Translate the following Hindu festival name into natural Gujarati.

Input:
${text}

Rules:
- Return ONLY the Gujarati translation.
- Use Gujarati script only.
- Do not return English.
- Do not provide explanations.
- Do not add quotes.
- Keep the meaning accurate.
`;

    try {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": "Bearer yourownapikey", "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "anthropic/claude-sonnet-5",
                messages: [{ role: "user", content: prompt }]
            })
        });

        const data = await response.json();

        if (!data.choices) {
            console.error("Gujarati translation error:", data.error);
            return text;
        }

        return data.choices[0].message.content.trim();

    } catch (error) {
        console.error("Gujarati translation failed:", error);
        return text;
    }
}

async function init() {
    try {
        const result = getDailyPanchang(
            new Date(),
            { latitude: 23.03, longitude: 72.58 },
            { timezone: 330 }
        );

        console.log("Festivals of the day:", result.festivals);

        let specialDay = null;

        if (result.festivals && result.festivals.length > 0) {
            const major = result.festivals.find(f => f.type === "major");
            const festival = major || result.festivals[0];
            specialDay = await translateFestivalToGujarati(festival.name);
        }

        const tithi = result.tithis[0];
        const tithiNumber = tithi.number;
        const paksha = tithi.paksha.toLowerCase();

        let displayTithi;

        if (paksha === "krishna" && tithiNumber === 15) {
            displayTithi = "અમાસ";
        } else {
            displayTithi = TITHI_GU[tithiNumber - 1] || tithi.name;
        }

        const gujaratiPaksha = PAKSHA_GU[paksha] || tithi.paksha;

        document.getElementById("container").classList.toggle("special", specialDay !== null);

        if (specialDay) {
            document.getElementById("date-info").innerHTML =
                `આજે: ${specialDay}<br>તિથિ: ${displayTithi} ${gujaratiPaksha}`;
        } else {
            document.getElementById("date-info").textContent =
                `તિથિ: ${displayTithi} ${gujaratiPaksha}`;
        }

        const suvichar = await generateSuvichar(specialDay);
        document.getElementById("suvichar-loader").classList.add("hidden");
        const textEl = document.getElementById("suvichar-text");
        textEl.textContent = suvichar;
        textEl.classList.remove("hidden");

    } catch (error) {
        console.error("Application Error:", error);
        document.getElementById("date-info").textContent =
            "⚠️ પંચાંગ માહિતી લોડ થઈ શકી નથી";

        document.getElementById("suvichar-loader").classList.add("hidden");
        const textEl = document.getElementById("suvichar-text");
        textEl.textContent = "⚠️ કંઈક ખોટું થયું. કૃપા કરીને ફરી પ્રયાસ કરો.";
        textEl.classList.remove("hidden");
    }
}

init();