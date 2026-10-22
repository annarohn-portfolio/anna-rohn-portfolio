// Content mirrors "portfolio 10-8-2026.pdf" page-for-page.
// Image ids: "x<n>" = image extracted from the PDF, "p<n>" = PDF page n rendered whole.
// `fundamental` is the architectural root each chapter is tied to in the 3D background.
// `tools` is reserved for the software icons (to be filled in per project).

export const person = {
  first: 'ANNA',
  last: 'ROHN',
  email: 'annasrohn@gmail.com',
  phone: '+1 (678) 986-9789',
  instagram: 'anna_rohn_art',
  linkedin: 'https://www.linkedin.com/in/anna-rohn-bb0314a7/',
  school: 'University of Texas at Austin School of Architecture',
};

export const projects = [
  {
    slug: 'n-lamar-lab',
    no: '01',
    title: 'N Lamar Lab',
    meta: 'Micheal Garrison, Austin TX, Partner, Comprehensive Studio Fall 2026',
    lines: ['Micheal Garrison', 'Partner: Rohan Bergfeld', 'Austin TX', 'Comprehensive Studio', 'Fall 2026'],
    kicker: 'BioReference Laboratories Concept',
    text: [
      'Our laboratory rethinks the excessive energy demands of contemporary research facilities by prioritizing low embodied energy materials and climate-responsive design. Rather than relying solely on mechanical systems, the building itself becomes a performance tool– reducing operational costs, minimizing environmental impact, and generating distinctive, expressive geometries.',
      'The primary materials selected for this design are fiber reinforced polymer and steel, both recognized for their exceptionally low embodied energy, durability, and long service life. These materials can be locally fabricated and transported, reducing carbon emissions while supporting regional industry. We intend to harness Austin’s tech industry, utilizing recycled tech in this design.',
      'To address the intense Texas heat, the laboratory is strategically oriented to capture prevailing Gulf winds, promoting natural ventilation and reducing cooling loads. A shaded and well-ventilated first-floor patio creates a comfortable outdoor amenity for occupants. Upper-level patios on the second and third floors extend this strategy, providing solar shading that enables expansive window walls while limiting glare and unwanted heat gain.',
    ],
    fundamental: { name: 'Plane', note: 'Layered floor plates and perforated screens' },
    tools: ['rhino', 'arcgis', 'd5', 'sim', 'hand'],
    lead: { id: 'x9', alt: 'N Lamar Lab, rendered aerial of the building massing' },
    plates: [
      { k: 'spread', ids: ['x7', 'x13'], alt: 'N Lamar Lab street view with overhead lines' },
      { k: 'spread', ids: ['p6', 'p7'], alt: 'N Lamar Lab building sections, site plan and hourly shadow study' },
      { k: 'spread', ids: ['hero-lab-clean', 'x92'], alt: 'N Lamar Lab cutaway axonometric beside the wall section' },
      { k: 'spread', ids: ['p10', 'p11'], alt: 'N Lamar Lab structural model, assembly details and physical model' },
    ],
  },
  {
    slug: 'deep-eddy-school-of-music',
    no: '02',
    title: 'Deep Eddy School of Music',
    meta: 'Micheal McCall, Austin TX, Individual, Design 3 Fall 2024',
    lines: ['Micheal McCall', 'Individual', 'Austin TX', 'Design 3', 'Fall 2024'],
    text: [
      'The design of the Music School in Austin, Texas, responds to the unique topography and urban context of the site, focusing on circulation as the primary organizational principle. Rather than adhering to the conventional “form follows function” approach, this project embraces “form follows circulation” to create fluid, intuitive movement throughout the space.',
      'The building emerges from the ground through careful grading, seamlessly integrating indoor and outdoor spaces. Programmatic elements are layered and interconnected, with circulation pathways guiding the experience and shaping the form of the structure. The interplay of mass and void, as well as strategic use of natural materials, reinforces a harmonious relationship between the building and its environment.',
      'Early conceptual explorations and site analyses informed a design that prioritizes spatial coherence, visual continuity, and contextual integration. By leveraging the natural slope of the site, the project achieves a strong dialogue between architecture and landscape, establishing a dynamic and immersive educational environment.',
    ],
    fundamental: { name: 'Line', note: 'Circulation as the organizing principle' },
    tools: ['rhino', 'illustrator', 'photoshop', 'd5', 'hand'],
    lead: { id: 'x115', alt: 'Deep Eddy School of Music circulation sketch' },
    plates: [
      { k: 'one', id: 'x118', alt: 'Deep Eddy School of Music rendered exterior' },
      { k: 'spread', ids: ['x124', 'x131'], alt: 'Deep Eddy School of Music terraced façade at dusk' },
      { k: 'spread', ids: ['p16', 'p17'], alt: 'Deep Eddy School of Music site plan and theater, first, second and third floor plans' },
      { k: 'spread', ids: ['p18', 'p19'], alt: 'Deep Eddy School of Music perspectives and sections' },
      { k: 'spread', ids: ['p20', 'p21'], alt: 'Deep Eddy School of Music massing diagrams and interior model' },
    ],
  },
  {
    slug: 'startup-lions-campus-kenya',
    no: '03',
    title: 'Startup Lions Campus Kenya',
    meta: 'Rasa Navasaitye, Kenya, Individual, Design 4 Spring 2025',
    lines: ['Rasa Navasaitye', 'Individual', 'Kenya', 'Design 4', 'Spring 2025'],
    text: [
      'This assignment focuses on understanding decoding spacial structure through analyzing the architectural precedent. I explored the Startup Lions Campus in Kenya’s unique operational and organizational strategies, formal and structural logistics, as well as experiential qualities. Emphasis was put on uncovering deep structures and spatial sequencing, particularly in relation to how architecture is formally articulated and occupied. I examined it across all scales, from the urban to detailed, with special attention given to representing spacial hierarchies. This assignment focused on three criteria: comprehension and analysis of architectural systems, development of clear and consistent visual representation, and effective teamwork and coordination.',
      'The architectural strategy of the Startup Lions Campus in Kenya embodies a balance between functional pragmatism and cultural resonance. By integrating local materials and construction techniques, the design harmonizes with its environment while maintaining a distinct modern aesthetic. The spatial hierarchy is carefully orchestrated to facilitate both collaborative and individual workspaces, promoting an organic flow between communal gathering areas and private study zones.',
    ],
    fundamental: { name: 'Volume', note: 'Massing and spatial hierarchy' },
    tools: ['photoshop', 'd5', 'illustrator', 'rhino'],
    lead: { id: 'x186', alt: 'Startup Lions Campus cutaway axonometric' },
    plates: [
      { k: 'one', id: 'p23', alt: 'Startup Lions Campus axonometric with site contours and shadows' },
      { k: 'spread', ids: ['x191', 'x194'], alt: 'Startup Lions Campus massing axonometric and site context' },
    ],
  },
  {
    slug: 'senegal-community-acupuncture',
    no: '04',
    title: 'Senegal Community Acupuncture',
    meta: 'Rasa Navasaitye, Dakar Senegal, Individual, Design 4 Spring 2025',
    lines: ['Rasa Navasaitye', 'Individual', 'Dakar Senegal', 'Design 4', 'Spring 2025'],
    // TODO(anna): the PDF copy ends mid-sentence ("…are giant,"); the dangling fragment is left out here.
    text: [
      'Located in the dense, irregularly shaped urban fabric of Dakar, Senegal, Community Acupuncture reimagines civic architecture as a playful, interconnected campus. The multi-use program—comprising a healthcare clinic, gymnasium, student housing, and an elementary school—is organized into a porous “jungle” of two- and three-story volumes. A defining feature is the dynamic double-roof system that folds and creases to reveal accessible rooftop gardens and pavilions, integrating local traditions of rooftop living while connecting users to the wider city landscape. Below, shaded courtyards work in tandem with the double roof to facilitate natural cross-ventilation and create comfortable microclimates throughout the site.',
    ],
    fundamental: { name: 'Light', note: 'A folded double roof, shade and cross-ventilation' },
    tools: ['rhino', 'd5', 'photoshop', 'illustrator'],
    lead: { id: 'x207', alt: 'Senegal Community Acupuncture massing model' },
    plates: [
      { k: 'spread', ids: ['x208', 'x211'], alt: 'Senegal Community Acupuncture rooftop garden interior' },
      { k: 'pair', ids: ['p28', 'p29'], alt: 'Senegal Community Acupuncture ground floor and green floor plans' },
      { k: 'spread', ids: ['p30', 'p31'], alt: 'Senegal Community Acupuncture longitudinal and transverse sections' },
      { k: 'spread', ids: ['p32', 'p33'], alt: 'Senegal Community Acupuncture rooftop pavilion and staircase atrium' },
      { k: 'spread', ids: ['x244', 'x247'], alt: 'Senegal Community Acupuncture timber canopy courtyard' },
      { k: 'spread', ids: ['x250', 'x253'], alt: 'Senegal Community Acupuncture site plan in the Dakar urban fabric' },
    ],
  },
  {
    slug: 'adaptation',
    no: '05',
    title: 'Adaptation',
    meta: 'Andy Bako, Austin TX, Group of 3, Comprehensive Design Fall 2025',
    lines: ['Andy Bako', 'Group of 3: Hannah Patterson and Valentina Tenorio', 'Austin TX', 'Comprehensive Design', 'Fall 2025'],
    text: [
      'Executed as a collaborative group project, this Urban Autopsy investigation centered on an abandoned residence discovered in Austin’s East Cesar Chavez neighborhood. Our team’s objective was to analyze decaying architecture and study the circular material economy by meticulously documenting the building’s failing components. We constructed a 1:24 scale miniature model and intentionally exaggerated the speed of its weathering. By subjecting the structure to extreme simulated conditions, we explored how building materials react to intense deterioration, focusing specifically on the physical actions of feathering and snapping. Through literal and representational cuts, we forcefully snapped off specific pieces of the building, peeling back its outer skin to reveal the interior layers and structural realities beneath. This hands-on dissection emphasized the tension between precise measurement and aggressive material failure. The resulting physical model—a striking exploration of structural decay—was selected to be featured on the cover of the Spring 2026 “Adaptation” issue of Texas Architect magazine.',
    ],
    badge: { id: 'x260', alt: 'Texas Architect', note: 'Featured on the cover of Texas Architect, Spring 2026' },
    fundamental: { name: 'Void', note: 'Cuts, snaps and material failure' },
    tools: [{ label: 'Adaptation', ids: ['hand', 'print3d', 'paint', 'laser', 'rhino', 'illustrator'] }, { label: 'Fragmentation', ids: ['hand', 'print3d', 'paint', 'laser', 'rhino', 'illustrator', 'grasshopper', 'blender'] }],
    plates: [
      { k: 'spread', ids: ['x258', 'x264'], alt: 'Adaptation weathered house model photographed against black' },
      { k: 'spread', ids: [['x267', 'x268'], 'p41'], alt: 'Adaptation house model photographs and material analysis of the existing house' },
      { k: 'spread', ids: ['p42', 'p43'], alt: 'Adaptation exploded drawing of the dissected house, collapsed house drawing and component catalogue' },
      {
        k: 'chapter',
        title: 'Fragmentation',
        text: 'Building on the Urban Autopsy, which treated Austin’s architecture in its preoperative state, this assignment turns from dissection toward the difficult work of rejoining. For this assignment, students are asked to design a small speculative shed assembled from fragments, sutures, and seams. This shed is emergent, not conceived as a finished object, but as a provisional body shaped by directional forces, hierarchies of structure, and scenographic depth. Students will test how tectonic systems of primary, secondary, and tertiary elements can both hold the shed together and produce novel aesthetic and spatial effects. The shed should not be imagined as a blank slate, but as a product of scar tissue: a body recomposed through layered discontinuities, aggregate formations, and the residues of prior incisions.',
        note: 'The shed should remain in the range of 20–30 ft in width and 30–40 ft in length, producing a footprint between 600–900 sq ft. Height should be limited to one story, max 18–20 ft, to preserve its character as a “shed” rather than a house or pavilion.',
      },
      { k: 'spread', ids: ['p44', 'p45'], alt: 'Fragmentation shed elevation drawings' },
      { k: 'spread', ids: ['x315', 'x318'], alt: 'Fragmentation shed physical model of layered boards' },
      { k: 'spread', ids: ['p48', 'p49'], alt: 'Fragmentation shed plan and linework study' },
    ],
  },
  {
    slug: 'measure-twice',
    no: '06',
    title: 'Measure Twice',
    kicker: '300 Baylor Street',
    meta: 'Andy Bako, 300 Baylor Street Austin TX, Comprehensive Design Spring 2026',
    lines: ['Andy Bako', 'Individual', '300 Baylor Street, Austin TX', 'Comprehensive Design', 'Spring 2026'],
    text: [
      'The final assignment consolidates the semester’s investigations into a fully realized proposal for the Material Commons at 300 Baylor Street. This phase demands that you synthesize measurement, dissection, reassembly, and spectral interference into an operative architecture that addresses program, structure, circulation, and temporal evolution with precision and coherence.',
      'Where ADAPTATION treated architecture as a body awaiting autopsy, FRAGMENTATION explored the provisional logics of rejoining fragments, and Assignment 3 tested volumetric composition through interference and layering, the final project must now demonstrate how these operations prefigure a building that functions as both infrastructure and archive, organizing flows of salvaged materials while registering the contradictions inherent to classification, storage, and reuse.',
      'Your proposal should reconcile formal techniques developed throughout the semester with the operational demands of the material commons. Ghosting, layering, and interference are not purely aesthetic choices but necessary architectural languages that embody the tensions of archiving: order and disorder, presence and absence, permanence and change. The building must acknowledge that materials arrive carrying histories, resist fixed categories, and move through cycles of accumulation and dispersal. Your architecture should make these rhythms legible while providing the infrastructural clarity necessary for ongoing adaptation.',
    ],
    badge: { id: 'x339', alt: 'Texas Architect', note: 'Featured in Texas Architect, Spring 2026' },
    fundamental: { name: 'Grid', note: 'Measurement, module and the archive' },
    tools: ['rhino', 'illustrator', 'grasshopper', 'blender', 'photoshop'],
    plates: [
      { k: 'spread', ids: ['x343', 'x350'], alt: 'Measure Twice brick model of the Material Commons' },
      { k: 'spread', ids: ['p52', 'p53'], alt: 'Measure Twice detail drawings and site plan of 300 Baylor Street' },
      { k: 'spread', ids: ['p54', 'p55'], alt: 'Measure Twice plan, elevations, model and sectional perspectives' },
      {
        k: 'overlay',
        ids: ['x392', 'x396'],
        alt: 'Measure Twice final brick model photographed against black',
        text: '“Measure Twice was an undergraduate design studio taught by Emerging Scholar in Design Andrew Bako in the Fall 2025 semester at the University of Texas at Austin. The studio positioned slowness as both an ethical stance and a design imperative in a resource-depleted world. Rather than rushing toward demolition and new construction, students approached measuring, marking, and cutting as consequential design acts that balance care with control. They began by documenting Austin homes slated for demolition, producing precise as-built drawings, scaled miniatures, and surgical-style “pre-op” plans to guide deconstruction. In the second phase, students designed a civic material repository—part warehouse, part archive, part public interface—that supports reuse. Ultimately, the studio argued that careful documentation and deliberate cuts conserve embodied energy, transform waste into shared resources, and position the archive as an active instrument of repair and future-making. The model shown here is by UTSOA architecture student Anna Rohn.”',
      },
      { k: 'one', id: 'x396', alt: 'Measure Twice brick model, aerial view' },
    ],
  },
];

// Fine-art gallery. Every caption reads: year · medium · size (inches).
export const gallery = {
  no: '07',
  title: 'Fine Art',
  intro: 'My artwork explores the intersection of realism and abstraction, capturing raw human emotion and organic forms with a vivid, expressive touch. Each piece is a study in contrast—balancing precision with fluidity, depth with spontaneity. From delicate charcoal sketches to vibrant oil paintings, I experiment with the tension between clarity and chaos, evoking both familiarity and intrigue.',
  works: [
    { id: 'art-544', frame: 'black', size: [20, 15], title: 'Tone Drawing', meta: '2023 · Graphite · 20” × 15”', matted: true, alt: 'Graphite tone drawing of a woman resting her head on her arms' },
    { id: 'art-uva', frame: 'bronze', size: [24, 16], title: 'UVA Rotunda', meta: '2026 · Oils · 24” × 16”', alt: 'Oil painting of the University of Virginia Rotunda seen through blossoming trees and old oaks' },
    { id: 'art-trinity', frame: 'gold', size: [16, 20], title: 'Trinity College', meta: '2019 · Acrylic · 16” × 20”', alt: 'Acrylic painting of the Campanile at Trinity College on a rainy day, students crossing the square under umbrellas' },
    { id: 'art-401', frame: 'black', size: [24, 30], title: '“Caravaggio”', meta: '2023 · Acrylic · 24” × 30”', alt: '“Caravaggio”, a black-and-white acrylic portrait of a young man holding fruit' },
    { id: 'art-icaa', frame: 'gold', size: [22, 16], title: 'ICAA Pavilion', meta: '2026 · Watercolor rendering · 22” × 16”', matted: true, alt: 'Watercolor rendering of a classical pavilion with elevation, plan, section details and a garden plan' },
    { id: 'art-537', frame: 'black', size: [18, 24], title: 'Dementia', meta: '2024 · Oils · 18” × 24”', alt: 'Oil painting “Dementia”: a woman’s face dissolving into abstract strokes of red and grey' },
    { id: 'art-538', frame: 'gold', size: [40, 30], title: 'Warped Mind', meta: '2024 · Oils, hands and Photoshop · 40” × 30”', alt: 'Painting “Warped Mind”: three overlapping faces and hands' },
    { id: 'art-539', frame: 'bronze', size: [24, 18], mat: 0.32, title: 'Still Life Chermoys', meta: '2020 · Acrylic and paint thinner · 24” × 18”', alt: 'Still life of cut and whole custard apples in warm dark tones' },
    // the mural is painted on the underside of a staircase, so it is not framed: the walk ends in the stairwell itself
    { id: 'art-183', finale: true, title: 'Imagination Mural', meta: '2023 · Acrylic · 100” × 160” × 84”', alt: 'The Imagination Mural: koi fish painted along the underside of a school staircase' },
  ],
};

export const resume = {
  experience: [
    { role: 'Architecture Intern', org: 'Design 103 International', place: 'Bangkok, Thailand', dates: 'July 2025 – August 2025', bullets: [
      'Developed equinox-based solar and ground shadow studies to support Thailand’s governmental environmental compliance review.',
      'Analyzed climate-responsive design strategies to optimize building performance and structural shading in high-heat tropical contexts.',
      'Assisted in drafting technical documentation and environmental impact diagrams for large-scale developments.' ] },
    { role: 'Architecture Intern', org: 'BENSLEY', place: 'Bangkok, Thailand', dates: 'June 2025 – August 2025', bullets: [
      'Developed advanced Adobe Photoshop skills to produce rendering visualizations for hospitality projects.',
      'Collaborated with design teams to conceptualize luxury resort layouts, landscapes, and site plans.' ] },
    { role: 'Architecture Intern', org: 'PAI Internship', place: 'Jakarta, Indonesia', dates: 'May 2024 – August 2024', bullets: [
      'Conducted in-depth cultural, historical, and religious site research to inform the contextual design of a luxury resort development.',
      'Translated complex site analysis into architectural design concepts for international large-scale projects.',
      'Supported the production of schematic design drawings and physical models to facilitate early-stage reviews.' ] },
    { role: 'ICAA NYC Summer Studio', org: 'Institute of Classical Architecture & Art (ICAA)', place: 'New York, NY', dates: 'June 2026 – July 2026', bullets: [
      'Learned to draw, measure ratio, and draft different orders of classical art and architecture.',
      'Conducted site visits across New York City to study classical design principles, proportions, and masonry.' ] },
    { role: 'London Maymester', org: 'Emerging Technologies Architectural Photography', place: 'London', dates: 'May 2026', bullets: [
      'Studied architectural precedents across London.',
      'Refined advanced architectural photography techniques under the instruction of esteemed faculty members, including Dean Wefter and Professor David Heymann.',
      'Documented and translated complex urban spaces into comprehensive visual studies to expand representational and analytical skill sets.' ] },
    { role: 'NYC Spring Seminar', org: 'UT Austin School of Architecture', place: 'New York, NY', dates: 'March 2026', bullets: [
      'Investigated diverse operational models, studio cultures, and design methodologies through direct engagement with firm leadership and design staff by actively touring and networking at eight globally recognized firms.',
      'Synthesized insights from professional site visits to critically evaluate contemporary architectural practice and inform future career trajectories.' ] },
  ],
  education: {
    school: 'University of Texas at Austin School of Architecture',
    dates: '2023 – 2028',
    line: 'Bachelor of Architecture (B.Arch) NAAB Accredited 5-Year Professional Degree Program (Master’s Equivalent)',
  },
  awards: [
    { title: 'Texas Architect Magazine Publication, Featured Student Work', dates: 'Spring 2026', text: 'Bako studio work selected for publication and featured on front and back cover of the magazine.' },
    { title: 'UTSOA End of Year Show, Selected Exhibitor', dates: '2025 & 2026', text: 'Final physical model from Design III and the bay model from comprehensive design selected for summer exhibition by studio critics.' },
    { title: 'AIA Student Exhibition, Selected Exhibitor', dates: 'Spring 2025', text: 'Featured selection of architectural drawings produced in Design 5B showcased in the gallery exhibition.' },
  ],
  leadership: [
    { title: 'National Organization of Minority Architecture Students (NOMAS), Treasurer', dates: 'August 2026 – Present', bullets: [
      'Tracked expenses, oversaw member donations, and balanced budgets for 2026-2027 academic year.',
      'Formulated the financial strategy for the NOMA National Conference in Miami.',
      'Direct catering budgets and independently coordinate food transport for all chapter events.' ] },
    { title: 'Alpha Chi Omega Alpha Pli Chapter, Day Chair', dates: '2024 – 2025', bullets: [
      'Conceptualized, designed, and hand-painted large-scale promotional banners to visually anchor chapter philanthropies, recruitment events, and major social functions.',
      'Directed volunteer design committees, coordinating group fabrication sessions and delegating tasks to ensure the efficient production of high-quality event decorations.' ] },
  ],
  skills: [
    { group: 'Design & Modeling', items: 'Rhino, Grasshopper, Sketchup, Blender' },
    { group: 'Visualization', items: 'Lumion, Enscape, D5, Midjourney, Adobe Creative Cloud (Illustrator, Photoshop, Animate, Indesign, Lightroom)' },
    { group: 'Fabrication', items: '3D Printing (netfab, ideamaker, Prusa Slicer), Hand Modeling, Hand Drafting, Acrylic, oil, charcoal, and Watercolor rendering' },
  ],
};
