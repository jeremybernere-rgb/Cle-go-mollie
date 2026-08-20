const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: "32kb" }));
app.use(express.static(path.join(__dirname, "public")));

function money(value) {
  const n = Number(String(value).replace(",", "."));
  if (!Number.isFinite(n) || n <= 0) return null;
  return n.toFixed(2);
}

function clean(value, max = 255) {
  return String(value || "").trim().slice(0, max);
}

app.post("/api/create-payment-link", async (req, res) => {
  try {
    const apiKey = process.env.MOLLIE_API_KEY;
    const adminPin = process.env.ADMIN_PIN;

    if (!apiKey) {
      return res.status(500).json({ error: "MOLLIE_API_KEY n'est pas configurée sur le serveur." });
    }
    if (!adminPin) {
      return res.status(500).json({ error: "ADMIN_PIN n'est pas configuré sur le serveur." });
    }
    if (String(req.headers["x-admin-pin"] || "") !== String(adminPin)) {
      return res.status(401).json({ error: "Code PIN incorrect." });
    }

    const amountValue = money(req.body.amount);
    if (!amountValue) {
      return res.status(400).json({ error: "Montant invalide." });
    }

    const description = clean(req.body.description, 255);
    const givenName = clean(req.body.givenName, 80);
    const familyName = clean(req.body.familyName, 80);
    const email = clean(req.body.email, 160);
    const streetAndNumber = clean(req.body.streetAndNumber, 160);
    const postalCode = clean(req.body.postalCode, 24);
    const city = clean(req.body.city, 100);
    const country = clean(req.body.country, 2).toUpperCase();
    const phone = clean(req.body.phone, 40);

    if (!description || !givenName || !familyName || !email ||
        !streetAndNumber || !postalCode || !city || country.length !== 2) {
      return res.status(400).json({
        error: "Remplis tous les champs client obligatoires, y compris le code pays à 2 lettres."
      });
    }

    const currency = "EUR";
    const body = {
      description,
      amount: { currency, value: amountValue },
      reusable: false,
      allowedMethods: ["klarna"],
      lines: [
        {
          description,
          quantity: 1,
          unitPrice: { currency, value: amountValue },
          totalAmount: { currency, value: amountValue }
        }
      ],
      billingAddress: {
        givenName,
        familyName,
        streetAndNumber,
        postalCode,
        city,
        country,
        email,
        ...(phone ? { phone } : {})
      }
    };

    // Facultatif : URL de retour après paiement.
    if (process.env.REDIRECT_URL) body.redirectUrl = process.env.REDIRECT_URL;

    const response = await fetch("https://api.mollie.com/v2/payment-links", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const detail =
        data?.detail ||
        data?.title ||
        data?.message ||
        "Mollie a refusé la création du lien.";
      return res.status(response.status).json({
        error: detail,
        mollie: data
      });
    }

    const url =
      data?._links?.paymentLink?.href ||
      data?._links?.checkout?.href ||
      data?._links?.redirect?.href;

    if (!url) {
      return res.status(502).json({
        error: "Le lien a été créé mais l'URL de paiement n'a pas été trouvée dans la réponse Mollie.",
        mollie: data
      });
    }

    return res.json({
      id: data.id,
      url,
      amount: amountValue,
      description
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erreur serveur lors de la création du lien." });
  }
});

app.get("/health", (_req, res) => res.json({ ok: true }));

app.listen(PORT, () => {
  console.log(`Clé & Go Mollie lancé sur le port ${PORT}`);
});
