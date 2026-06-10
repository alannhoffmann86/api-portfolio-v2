export default async function handler(req, res) {
    // 1. Gestion du CORS : Indispensable pour autoriser ton site GitHub Pages à contacter cette API
    res.setHeader('Access-Control-Allow-Origin', '*'); // En production, remplace '*' par 'https://ton-pseudo.github.io'
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Réponse rapide pour les requêtes de pré-vérification du navigateur
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Méthode non autorisée' });
    }

    const userMessage = req.body.message;
    const apiKey = process.env.GEMINI_API_KEY; // Ta clé secrète sera cachée ici

    // URL officielle de l'API Gemini
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    // 2. Le "System Prompt" : C'est ici que tu programmes le comportement de l'IA
    const payload = {
        system_instruction: {
            parts: { text: "Tu es l'assistant virtuel d'Alann Hoffmann, un technicien expert en infrastructure SISR. Ton but est de répondre aux visiteurs de son portfolio. Tu dois être professionnel, concis et mettre en valeur ses compétences (Windows Server, Linux, Réseau Cisco, pfSense) et son alternance actuelle. Réponds toujours en utilisant des balises HTML simples comme <strong> ou <br> pour formater le texte." }
        },
        contents: [{
            parts: [{ text: userMessage }]
        }]
    };

    try {
        // 3. Requête vers l'IA
        const response = await fetch(geminiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await response.json();
        
        // Extraction du texte de la réponse
        const botReply = data.candidates[0].content.parts[0].text;

        // 4. Renvoi de la réponse à ton site web
        return res.status(200).json({ reply: botReply });
        
    } catch (error) {
        console.error(error);
        return res.status(500).json({ reply: "Désolé, mes serveurs sont temporairement inaccessibles." });
    }
}