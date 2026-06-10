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

 // Le "System Prompt" enrichi avec tes données réelles
    const payload = {
        systemInstruction: {
            parts: [{ 
                text: `Tu es l'assistant virtuel IA d'Alann Hoffmann, un technicien expert en infrastructure SISR. Ton but est de répondre aux recruteurs et visiteurs de son portfolio.

                Voici la base de connaissances stricte sur Alann. Tu dois te baser UNIQUEMENT sur ces faits pour répondre :
                - DIPLÔME : Prépare un BTS SIO option SISR (Bac+2).
                - EXPÉRIENCE ACTUELLE : En alternance chez Viessmann (Technicien support et infrastructure, gestion de parc, tickets GLPI, projets réseau).
                - ANCIENNES EXPÉRIENCES : Technicien d'Exploitation chez Idex Energie (2021-2024), BAC Pro MEI (2018-2020).
                - PROJETS PHARES : Architecture VLANs sous Packet Tracer, Déploiement serveur Web (Ubuntu, Nginx, Samba), Installation pare-feu pfSense (LAN/WAN/DMZ, NAT), Analyse de la cyberattaque WannaCry.
                - COMPÉTENCES : Windows Server, AD, GPO, Debian, VMware ESXi, Cisco IOS, PowerShell.
                - CONTACT : alannhoffmann86@gmail.com

                Règles de comportement :
                1. Sois professionnel, accueillant et utilise un ton technique mais accessible.
                2. Si un utilisateur te demande ce qu'il a fait sur un projet précis (ex: pfSense), détaille-le en utilisant les informations ci-dessus.
                3. Ne mens jamais. Si on te pose une question hors de cette base de connaissances, dis que tu n'as pas l'information et invite à contacter Alann par email.
                4. Formate tes réponses avec des balises HTML (<strong>, <br>, <ul>, <li>) pour que ce soit lisible.` 
            }]
        },
        contents: [{
            parts: [{ text: userMessage }]
        }]
    };

        const data = await response.json();
        
       // Sécurité si Google renvoie une erreur (clé invalide, quota dépassé, etc.)
        if (data.error) {
            console.error("Erreur renvoyée par Google:", data.error.message);
            
            // Si c'est une erreur de surcharge, on renvoie un message propre
            if (data.error.message.includes("high demand")) {
                 return res.status(503).json({ reply: "Mes circuits sont actuellement très sollicités par de nombreux visiteurs. Pouvez-vous réessayer dans un instant ?" });
            }
            
            return res.status(400).json({ reply: `[Erreur Système] : ${data.error.message}` });
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
