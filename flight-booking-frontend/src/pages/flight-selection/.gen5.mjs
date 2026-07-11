import fs from "fs";

const src = "C:/Users/vinh/.codex/attachments/3b1581fd-c151-422f-988e-6e13ed651d05/pasted-text.txt";
const html = fs.readFileSync(src, "utf8");

const bodyMatch = html.match(/<body([^>]*)>([\s\S]*?)<\/body>/i);
const bodyAttrs = bodyMatch[1];
let body = bodyMatch[2];

const bodyClassMatch = bodyAttrs.match(/className?="([^"]*)"/);
const bodyClass = bodyClassMatch ? bodyClassMatch[1] : "bg-background text-on-background font-body-md selection:bg-lotus-gold selection:text-white";

// Strip HTML comments
body = body.replace(/<!--[\s\S]*?-->/g, "");

// Strip <script> blocks (invalid in JSX)
body = body.replace(/<script[\s\S]*?<\/script>/gi, "");

// Minimal JSX conversions
body = body.replace(/\bclass=/g, "className=");
body = body.replace(/\bfor=/g, "htmlFor=");
body = body.replace(/<input([^>]*[^/])>/g, '<input$1 />');
body = body.replace(/<br>/g, '<br />');
body = body.replace(/<hr>/g, '<hr />');
body = body.replace(/<img([^>]*[^/])>/g, '<img$1 />');
body = body.replace(/style="([^"]*)"/g, (m, c) => {
  const props = c.split(";").filter(Boolean).map(p => {
    const [k, ...v] = p.split(":");
    const val = v.join(":").trim();
    const camel = k.trim().replace(/-([a-z])/g, (_, c) => c.toUpperCase());
    return camel + ": '" + val.replace(/'/g, "\\'") + "'";
  });
  return "style={{" + props.join(", ") + "}}";
});

// Now replace STATIC data with DYNAMIC data
// These are the ONLY changes allowed per user's rules

// 1. Hero route: "Hanoi (HAN) → Ho Chi Minh City (SGN)" -> dynamic
body = body.replace(
  "Hanoi (HAN) <span className=\"text-lotus-gold mx-2\">→</span> Ho Chi Minh City (SGN)",
  "{fromCode} <span className=\"text-lotus-gold mx-2\">→</span> {toCode}"
);

// 2. Hero subtitle: "Wed, 18 Oct 2023 | 1 Adult | Economy" -> dynamic
body = body.replace(
  "Wed, 18 Oct 2023 | 1 Adult | Economy",
  "{dateParam ? formatDate(dateParam) : \"\"}{dateParam ? \" | \" : \"\"}1 Adult | Economy"
);

// 3. Flight cards: need to wrap the 3 static flight cards in a map over flights
// The pattern is: <!-- Flight Card 1 --> ... <!-- Flight Card 2 --> ... <!-- Flight Card 3 --> ...
// Replace the whole block with a map

// First, capture the 3 flight card blocks
// The flight cards start with first <div className="bg-white rounded-xl overflow-hidden...
// and end with the </div> that closes the last card, before </div></div></div>" (closing the flight list column)

// Actually, the structure is more complex. Let me use a different approach:
// Find the template for a single flight card and replicate it with .map()

// From the HTML, there are 3 flight cards. Let me extract the first one as template.
const flightCardRegex = /(<!-- Flight Card \d -->[\s\S]*?)(?=<!-- Flight Card \d -->|<!-- Footer Shell -->)/g;
let cards = [];
let match;
while ((match = flightCardRegex.exec(body)) !== null) {
  cards.push(match[1]);
}

// If we found cards (3 of them), replace the whole batch with a dynamic map
if (cards.length >= 3) {
  const allCards = cards.join("\n");
  // The template is the first card
  const template = cards[0];
  // Replace hardcoded values in the template with JSX expressions
  let tmpl = template
    .replace(/VN \d+/g, "{flight.soHieuChuyenBay}")
    .replace(/Boeing 787-9 Dreamliner|Airbus A350-900|Airbus A321neo/g, "{flight.dongMayBay}")
    .replace(/(\d{2}:\d{2})/g, (m) => {
      // Only replace times that look like flight times
      // This is tricky because there are hh:mm patterns everywhere
      return "{formatTime(flight.gioKhoiHanh)}";
    })
    .replace(/text-label-lg font-label-lg text-on-surface-variant font-bold">[A-Z]{3}<\/p>/g, "{flight.maSanBayDi}")
  ;

  // Replace the static cards with dynamic map
  const flightListHtml = cards[0] + cards[1] + cards[2];
  body = body.replace(
    flightListHtml,
    "{filteredFlights.map((flight) => (" + template + "))}"
  );
}

// Actually this approach is too fragile. Let me try a different way.
// Just build the component properly.

console.log("body processed, length: " + body.length);
