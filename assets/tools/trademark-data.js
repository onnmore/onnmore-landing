/* ══════════ ONNMORE TOOLS — TRADEMARK CLASS REFERENCE DATA ══════════
   General-information mapping based on the internationally used NICE
   Classification (45 classes covering goods 1–34 and services 35–45).
   Keyword lists are illustrative, not exhaustive — see the tool page's
   disclaimer. Centralized here so it's easy to refine over time. */
var TRADEMARK_CLASSES = [
  { no: 1, desc: 'Chemicals for industry, science, agriculture; unprocessed plastics/resins; fertilisers.', kw: ['chemical', 'fertiliser', 'fertilizer', 'resin', 'industrial chemical', 'adhesive raw material'] },
  { no: 2, desc: 'Paints, varnishes, lacquers; preservatives against rust; colorants, dyes; printing inks.', kw: ['paint', 'varnish', 'dye', 'printing ink', 'coating', 'primer'] },
  { no: 3, desc: 'Cosmetics, perfumery, essential oils, soaps, cleaning and polishing preparations.', kw: ['cosmetic', 'perfume', 'soap', 'shampoo', 'skincare', 'makeup', 'cleaning product', 'detergent', 'salon'] },
  { no: 4, desc: 'Industrial oils and greases, fuels, lubricants, candles, wicks.', kw: ['oil', 'lubricant', 'fuel', 'candle', 'grease'] },
  { no: 5, desc: 'Pharmaceuticals, medical and veterinary preparations, dietary supplements, sanitary preparations.', kw: ['medicine', 'pharma', 'pharmaceutical', 'supplement', 'tablet', 'drug', 'ayurvedic', 'health supplement', 'sanitizer', 'sanitiser'] },
  { no: 6, desc: 'Common metals and their alloys, metal building materials, hardware, safes, pipes.', kw: ['metal', 'steel', 'iron', 'hardware', 'pipe fitting', 'safe'] },
  { no: 7, desc: 'Machines and machine tools, motors and engines (non-vehicle), agricultural implements.', kw: ['machine', 'machinery', 'engine', 'motor', 'industrial equipment', 'agricultural equipment'] },
  { no: 8, desc: 'Hand tools and implements (hand-operated), cutlery, side arms, razors.', kw: ['hand tool', 'cutlery', 'knife', 'razor', 'blade'] },
  { no: 9, desc: 'Scientific, electrical, IT and audio-visual equipment; software; safety and measuring devices.', kw: ['software', 'app', 'electronics', 'electrical device', 'computer', 'mobile app', 'sensor', 'battery', 'camera', 'saas'] },
  { no: 10, desc: 'Surgical, medical, dental and veterinary instruments and apparatus.', kw: ['surgical', 'medical device', 'dental', 'diagnostic equipment', 'orthopedic', 'orthopaedic'] },
  { no: 11, desc: 'Apparatus for lighting, heating, cooling, cooking, drying, ventilating and sanitary purposes.', kw: ['lighting', 'led light', 'fan', 'ac', 'air conditioner', 'water heater', 'kitchen appliance', 'refrigerator'] },
  { no: 12, desc: 'Vehicles and apparatus for locomotion by land, air or water.', kw: ['vehicle', 'car', 'bike', 'automobile', 'ev', 'electric vehicle', 'auto parts'] },
  { no: 13, desc: 'Firearms, ammunition, explosives, fireworks.', kw: ['firearm', 'ammunition', 'firework', 'explosive'] },
  { no: 14, desc: 'Precious metals and jewellery, horological and chronometric instruments.', kw: ['jewellery', 'jewelry', 'gold', 'silver', 'watch', 'ornament'] },
  { no: 15, desc: 'Musical instruments and accessories.', kw: ['musical instrument', 'guitar', 'piano', 'drum'] },
  { no: 16, desc: 'Paper, cardboard, printed matter, stationery, office requisites, packaging materials.', kw: ['paper', 'printing', 'stationery', 'notebook', 'packaging box', 'book publishing'] },
  { no: 17, desc: 'Rubber, gutta-percha, gum, asbestos, mica; plastics in extruded form; insulating materials.', kw: ['rubber', 'plastic sheet', 'insulation', 'gasket'] },
  { no: 18, desc: 'Leather and imitation leather goods, bags, umbrellas, saddlery.', kw: ['leather', 'bag', 'handbag', 'wallet', 'luggage', 'umbrella'] },
  { no: 19, desc: 'Non-metallic building materials, cement, bricks, tiles, non-metallic pipes.', kw: ['cement', 'tile', 'brick', 'construction material', 'building material'] },
  { no: 20, desc: 'Furniture, mirrors, picture frames, goods of wood/cork/cane/plastic.', kw: ['furniture', 'sofa', 'chair', 'mattress', 'wooden furniture', 'home decor'] },
  { no: 21, desc: 'Household or kitchen utensils, cookware, glassware, porcelain, cleaning tools.', kw: ['utensil', 'cookware', 'kitchenware', 'glassware', 'crockery', 'water bottle'] },
  { no: 22, desc: 'Ropes, string, nets, tents, tarpaulins, sacks, raw textile fibres.', kw: ['rope', 'tent', 'tarpaulin', 'sack', 'raw fibre'] },
  { no: 23, desc: 'Yarns and threads for textile use.', kw: ['yarn', 'thread'] },
  { no: 24, desc: 'Textiles and textile goods, household linen, curtains.', kw: ['textile', 'fabric', 'bedsheet', 'curtain', 'linen', 'towel'] },
  { no: 25, desc: 'Clothing, footwear, headgear.', kw: ['clothing', 'apparel', 'garment', 'footwear', 'shoes', 'tshirt', 't-shirt', 'fashion brand', 'saree', 'kurti'] },
  { no: 26, desc: 'Lace, embroidery, ribbons, buttons, hooks, artificial flowers, hair accessories.', kw: ['embroidery', 'lace', 'button', 'hair accessory', 'artificial flower'] },
  { no: 27, desc: 'Carpets, rugs, mats, wallpaper.', kw: ['carpet', 'rug', 'mat', 'wallpaper', 'flooring'] },
  { no: 28, desc: 'Games, toys, sporting articles, decorations for Christmas trees.', kw: ['toy', 'game', 'sporting good', 'sports equipment', 'gym equipment', 'board game'] },
  { no: 29, desc: 'Meat, fish, poultry, preserved/dried/cooked fruits and vegetables, dairy, edible oils.', kw: ['meat', 'dairy', 'milk', 'cheese', 'paneer', 'edible oil', 'frozen food', 'pickle', 'ghee'] },
  { no: 30, desc: 'Coffee, tea, cocoa, rice, flour, bread, pastry, snacks, sauces, spices, sugar.', kw: ['tea', 'coffee', 'spice', 'masala', 'snack', 'bakery', 'flour', 'sauce', 'sweets', 'mithai', 'namkeen', 'biscuit'] },
  { no: 31, desc: 'Raw agricultural produce, live animals, seeds, natural plants and flowers, animal feed.', kw: ['agriculture produce', 'grain', 'seed', 'livestock', 'animal feed', 'nursery plant'] },
  { no: 32, desc: 'Beers, mineral/aerated waters, non-alcoholic beverages, fruit juices, syrups.', kw: ['juice', 'soft drink', 'beverage', 'mineral water', 'soda', 'energy drink'] },
  { no: 33, desc: 'Alcoholic beverages (except beer).', kw: ['alcohol', 'wine', 'whisky', 'liquor'] },
  { no: 34, desc: 'Tobacco, smokers\u2019 articles, matches.', kw: ['tobacco', 'cigarette', 'match box', 'vape'] },
  { no: 35, desc: 'Advertising, business management, retail/wholesale trading services, online marketplaces.', kw: ['retail', 'wholesale', 'ecommerce', 'e-commerce', 'online store', 'marketing agency', 'advertising', 'trading company', 'reseller', 'business consultancy', 'shop'] },
  { no: 36, desc: 'Insurance, financial and monetary services, real estate affairs.', kw: ['finance', 'insurance', 'bank', 'loan', 'investment', 'real estate', 'fintech', 'nbfc'] },
  { no: 37, desc: 'Construction, repair and installation services.', kw: ['construction', 'contractor', 'repair service', 'installation', 'interior fit-out', 'renovation'] },
  { no: 38, desc: 'Telecommunications services.', kw: ['telecom', 'broadband', 'isp', 'messaging service'] },
  { no: 39, desc: 'Transport, packaging and storage of goods, travel arrangement, logistics.', kw: ['logistics', 'transport', 'courier', 'delivery service', 'travel agency', 'warehousing', 'cab service'] },
  { no: 40, desc: 'Treatment of materials — manufacturing/custom processing services for others.', kw: ['manufacturing service', 'custom processing', 'printing service', 'tailoring service', 'job work'] },
  { no: 41, desc: 'Education, training, entertainment, sporting and cultural activities.', kw: ['education', 'training', 'coaching', 'school', 'edtech', 'entertainment', 'event management', 'gym membership service', 'academy'] },
  { no: 42, desc: 'Scientific/technological services, software design and development, IT services.', kw: ['it service', 'software development', 'web development', 'app development', 'saas platform', 'cloud service', 'research and development', 'ai'] },
  { no: 43, desc: 'Services for providing food and drink, temporary accommodation.', kw: ['restaurant', 'cafe', 'caf\u00e9', 'cloud kitchen', 'catering', 'hotel', 'hostel', 'food delivery service'] },
  { no: 44, desc: 'Medical services, veterinary services, hygienic and beauty care, agriculture services.', kw: ['clinic', 'hospital', 'salon service', 'spa', 'healthcare service', 'veterinary', 'dental service', 'diagnostic lab'] },
  { no: 45, desc: 'Legal services, security services, personal and social services for individuals.', kw: ['legal service', 'law firm', 'security service', 'personal service', 'matchmaking', 'social service ngo'] }
];

/* Very small stop-word list so matching isn't thrown off by filler words */
var TM_STOPWORDS = ['a','an','the','and','or','of','for','with','my','our','is','are','we','i','to','in','on','business','company','services','service'];

function findTrademarkClasses(freeText) {
  var text = (freeText || '').toLowerCase();
  var scored = TRADEMARK_CLASSES.map(function (cls) {
    var score = 0;
    cls.kw.forEach(function (k) { if (text.indexOf(k) !== -1) score += k.split(' ').length; });
    return { cls: cls, score: score };
  }).filter(function (s) { return s.score > 0; });
  scored.sort(function (a, b) { return b.score - a.score; });
  return scored.slice(0, 6).map(function (s) { return s.cls; });
}
