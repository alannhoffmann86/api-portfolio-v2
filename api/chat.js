export default async function handler(req, res) {
    // Gestion du CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Méthode non autorisée' });
    }

    const userMessage = req.body.message;
    const apiKey = process.env.GEMINI_API_KEY;

    // URL officielle de l'API Gemini 1.5 Flash
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    // Le "System Prompt" corrigé avec le bon format attendu par Google
    const payload = {
        systemInstruction: {
            parts: [{ text: "Tu es l'assistant virtuel d'Alann Hoffmann, un technicien expert en infrastructure SISR. Ton but est de répondre aux visiteurs de son portfolio. Tu devez être professionnel, concis et mettre en valeur ses compétences (Windows Server, Linux, Réseau Cisco, pfSense) et son alternance actuelle chez Viessmann. Réponds toujours en utilisant des balises HTML simples comme <strong> ou <br> pour formater le texte." }]
        },
        contents: [{
            parts: [{ text: userMessage }]
        }]
    };

    try {
        const response = await fetch(geminiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await response.json();
        
        // Sécurité si Google renvoie une erreur (clé invalide, quota dépassé, etc.)
        if (data.error) {
            console.error("Erreur renvoyée par Google:", data.error.message);
            return res.status(400).json({ reply: `[Erreur API Google] : ${data.error.message}` });
        }

        // Extraction propre de la réponse de l'IA
        if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts) {
            const botReply = data.candidates[0].content.parts[0].text;
            return res.status(200).json({ reply: botReply });
        } else {
            return res.status(500).json({ reply: "Structure de réponse Google inattendue." });
        }
        
    } catch (error) {
        console.error("Erreur lors du Fetch:", error);
        return res.status(500).json({ reply: "Désolé, mon serveur relais n'a pas pu contacter l'IA." });
    }
}
