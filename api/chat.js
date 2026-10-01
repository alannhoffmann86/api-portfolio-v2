module.exports = async function handler(req, res) {
    // 1. Gestion du CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Méthode non autorisée' });
    }

    const userMessage = req.body?.message;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!userMessage) {
        return res.status(400).json({ reply: "Erreur : Aucun message reçu." });
    }

    // URL officielle de l'API Gemini 1.5 Flash
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    // 2. Le "System Prompt" enrichi avec tes données réelles
    const payload = {
        systemInstruction: {
            parts: [{ 
                text: `Tu es l'assistant virtuel IA d'Alann Hoffmann, un technicien alternant en infrastructure SISR. Ton but est d'accompagner les recruteurs et visiteurs de son portfolio.

                Voici la base de connaissances sur Alann :
                - DIPLÔME : Prépare un BTS SIO option SISR (Bac+2).
                - EXPÉRIENCE ACTUELLE : En alternance chez Viessmann (Technicien support et infrastructure, gestion de parc, tickets GLPI, projets réseau).
                - ANCIENNES EXPÉRIENCES : Technicien d'Exploitation chez Idex Energie (2021-2024), BAC Pro MEI (2018-2020).
                - PROJETS PHARES : Architecture VLANs sous Packet Tracer, Déploiement serveur Web (Ubuntu, Nginx, Samba), Installation pare-feu pfSense (LAN/WAN/DMZ, NAT), Analyse de la cyberattaque WannaCry.
                - COMPÉTENCES : Windows Server, AD, GPO, Debian, VMware ESXi, Cisco IOS, PowerShell.
                - CONTACT : alannhoffmann86@gmail.com

                Règles de comportement :
                1. Sois professionnel mais chaleureux, conversationnel, et n'hésite pas à faire preuve d'un peu d'humour.
                2. Tu es libre de développer tes explications, de discuter de technologies d'infrastructure de manière générale ou de donner des conseils techniques pertinents.
                3. Reste fidèle au profil d'Alann pour ce qui le concerne directement. S'il manque un détail précis sur sa vie ou son parcours, utilise une pirouette amusante pour esquiver ou invite le visiteur à le contacter par email.
                4. Formate tes réponses avec des balises HTML (<strong>, <br>, <ul>, <li>) pour que ce soit lisible.` 
            }]
        },
        contents: [{
            parts: [{ text: userMessage }]
        }],
        generationConfig: {
            temperature: 0.8,
            topP: 0.95
        }
    };
    try {
        // 3. Requête vers l'IA
        const response = await fetch(geminiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await response.json();
        
        // Sécurité si Google renvoie une erreur
        if (data.error) {
            console.error("Erreur renvoyée par Google:", data.error.message);
            if (data.error.message.includes("high demand")) {
                 return res.status(503).json({ reply: "Mes circuits sont actuellement très sollicités par de nombreux visiteurs. Pouvez-vous réessayer dans un instant ?" });
            }
            return res.status(400).json({ reply: `[Erreur Système Google] : ${data.error.message}` });
        }

        // Extraction propre de la réponse
        if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts) {
            const botReply = data.candidates[0].content.parts[0].text;
            return res.status(200).json({ reply: botReply });
        } else {
            return res.status(500).json({ reply: "Structure de réponse Google inattendue." });
        }
        
    } catch (error) {
        console.error("Erreur lors du Fetch interne:", error);
        return res.status(500).json({ reply: "Désolé, mon serveur relais n'a pas pu contacter l'IA." });
    }
}
