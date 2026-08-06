import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Create Express application
const app = express();
const PORT = 3000;

// Body parsing middlewares
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Shared Gemini Client Instance
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      aiClient = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });
    }
  }
  return aiClient;
}

// -------------------------------------------------------------------------
// Heuristic rules-based backup analyzer (if API Key is missing)
// -------------------------------------------------------------------------
interface AnalyzedOrder {
  id: string;
  is_suspicious: boolean;
  confidence_score: number;
  risk_level: 'High' | 'Medium' | 'Low';
  risk_reasons: string[];
}

function runLocalHeuristicAnalysis(orders: any[]): AnalyzedOrder[] {
  return orders.map(order => {
    const reasons: string[] = [];
    let score = 0;

    const name = (order.customer_name || '').toLowerCase().trim();
    const email = (order.email || '').toLowerCase().trim();
    const phone = (order.phone || '').toLowerCase().trim();
    const address = (order.address || '').toLowerCase().trim();
    const qty = Number(order.quantity) || 1;

    // 1. Name heuristics
    if (name.length < 3) {
      reasons.push("Customer name is unusually short.");
      score += 30;
    }
    if (/^[a-z0-9]+$/i.test(name) && !name.includes(' ')) {
      reasons.push("Single-word alphanumeric name without standard spacing.");
      score += 20;
    }
    const dummyNames = ['test', 'dummy', 'asdf', 'ghjk', 'fake', 'john doe', 'jane doe', 'nobody', 'abc', 'xyz', 'none'];
    if (dummyNames.some(d => name.includes(d))) {
      reasons.push("Name resembles a placeholder or dummy profile.");
      score += 50;
    }

    // 2. Email heuristics
    if (email) {
      if (email.includes('test') || email.includes('fake') || email.includes('dummy') || email.startsWith('a@') || email.startsWith('test@')) {
        reasons.push("Email address resembles a placeholder format.");
        score += 40;
      }
      if (!email.includes('@') || !email.includes('.')) {
        reasons.push("Syntactically malformed email structure.");
        score += 30;
      }
    } else {
      reasons.push("Missing email contact channel.");
      score += 15;
    }

    // 3. Phone heuristics
    const digitsOnly = phone.replace(/[^0-9]/g, '');
    if (digitsOnly.length < 6) {
      reasons.push("Phone number is too short to be genuine.");
      score += 40;
    }
    if (/^(.)\1+$/.test(digitsOnly) || digitsOnly === '12345678' || digitsOnly === '123456789' || digitsOnly === '0123456789') {
      reasons.push("Phone number contains repetitive digits or a simple sequential sequence.");
      score += 55;
    }

    // 4. Address heuristics
    if (address.length < 5) {
      reasons.push("Shipping address lacks sufficient geographic resolution.");
      score += 35;
    }
    const dummyAddresses = ['test', 'dummy', 'none', 'na', 'n/a', 'somewhere', 'address', 'street', 'city', 'house', 'no address'];
    if (dummyAddresses.some(d => address === d || address.startsWith(d + ' ') || address.endsWith(' ' + d))) {
      reasons.push("Address contains clear placeholder descriptors.");
      score += 45;
    }

    // 5. Quantity heuristics
    if (qty > 5) {
      reasons.push(`Abnormally high COD item volume (Qty: ${qty}) requested for high-value tech variants.`);
      score += 25;
    }

    // Risk mapping
    score = Math.min(score, 100);
    let riskLevel: 'High' | 'Medium' | 'Low' = 'Low';
    if (score >= 60) riskLevel = 'High';
    else if (score >= 30) riskLevel = 'Medium';

    return {
      id: String(order.id),
      is_suspicious: score >= 30,
      confidence_score: score,
      risk_level: riskLevel,
      risk_reasons: reasons
    };
  });
}

// -------------------------------------------------------------------------
// AI Fraud Analysis Route
// -------------------------------------------------------------------------
app.post("/api/gemini/analyze-fraud", async (req, res) => {
  try {
    const { orders } = req.body;
    if (!orders || !Array.isArray(orders)) {
      return res.status(400).json({ error: "Missing or invalid orders array in payload." });
    }

    const client = getGeminiClient();
    if (!client) {
      console.log("GEMINI_API_KEY not found in environment, running local fallback analytics.");
      const heuristicResults = runLocalHeuristicAnalysis(orders);
      return res.json({
        results: heuristicResults,
        is_ai_powered: false,
        message: "Analyzed locally using built-in COD fraud engine. Provide a GEMINI_API_KEY in the Settings panel to unlock full AI cognitive fraud scanning!"
      });
    }

    console.log(`Forwarding ${orders.length} orders to Gemini-3.6-Flash for cognitive risk verification...`);
    
    // Prepare prompt
    const prompt = `You are an expert Cash on Delivery (COD) fraud prevention assistant.
Analyze the following list of e-commerce orders to identify potential fake bookings, mock inputs, or high-risk scam listings.
Scan the customer names, email formats, phone digit repetition patterns, address specificity, and product quantities for anomalies.

Specifically flag orders that have:
- Dummy names (e.g. "test", "qwerty", "abc", single letter inputs).
- Repeated/simplistic phone digits (e.g., "11111111", "+212 000000", "+212 123456").
- Nonsensical emails (e.g. "a@a.com", "test@test.com", "fake@fake.com").
- Vague, placeholder or blank addresses (e.g., "test address", "street", "none", "marrakech").
- Spammed orders with unusually high purchase velocity or quantity.

Orders to analyze:
${JSON.stringify(orders, null, 2)}

Classify every single order by its ID. Be accurate and objective. Do not flag legitimate orders. Ensure the output matches the required JSON response schema.`;

    const response = await client.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          description: "List of fraud analysis assessments for the submitted orders.",
          items: {
            type: Type.OBJECT,
            properties: {
              id: {
                type: Type.STRING,
                description: "The unique ID of the order. Make sure it matches the exact ID of the scanned order.",
              },
              is_suspicious: {
                type: Type.BOOLEAN,
                description: "True if this order exhibits fraud markers, suspicious parameters, or dummy data fields.",
              },
              confidence_score: {
                type: Type.INTEGER,
                description: "Integer score from 0 to 100 representing probability of fraud.",
              },
              risk_level: {
                type: Type.STRING,
                description: "Risk category: 'High', 'Medium', or 'Low'. Only flag suspicious orders as High or Medium.",
              },
              risk_reasons: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "List of specific human-readable risk indicators identified (e.g. 'Customer phone number contains non-functional repeated digits 99999').",
              }
            },
            required: ["id", "is_suspicious", "confidence_score", "risk_level", "risk_reasons"]
          }
        }
      }
    });

    const parsedResults = JSON.parse(response.text || "[]");
    return res.json({
      results: parsedResults,
      is_ai_powered: true,
      message: "Scanned successfully using Gemini AI Cognitive Intelligence models."
    });

  } catch (error: any) {
    console.error("Gemini Fraud API Error:", error);
    // Return heuristic fallback as absolute safety
    try {
      const { orders } = req.body;
      if (orders && Array.isArray(orders)) {
        const fallback = runLocalHeuristicAnalysis(orders);
        return res.json({
          results: fallback,
          is_ai_powered: false,
          message: `Local fallback scanner deployed. (AI error: ${error.message})`
        });
      }
    } catch {}
    return res.status(500).json({ error: `Cognitive scanner failed: ${error.message}` });
  }
});

// -------------------------------------------------------------------------
// Front-end Server & Vite Integration
// -------------------------------------------------------------------------
async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Vite development server middleware mounted.");
  } else {
    // Serve static client build in production
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
    console.log(`Serving static production files from ${distPath}`);
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`-----------------------------------------------------`);
    console.log(`🚀 Cash-On-Delivery Portal running at http://localhost:${PORT}`);
    console.log(`🚀 Active Environment Mode: ${process.env.NODE_ENV || 'development'}`);
    console.log(`-----------------------------------------------------`);
  });
}

startServer();
