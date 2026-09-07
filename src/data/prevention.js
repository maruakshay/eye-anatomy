/* ---------------------------------------------------------------------------
   Prevention, graded honestly. `evidence` runs 1–4:

     4  randomised trials or a screening programme with measured outcomes
     3  consistent cohort evidence, or a mechanism that is not seriously
        in doubt (eye protection stopping a projectile)
     2  plausible and widely advised, but the trial evidence is thin
     1  reasonable to do; don't expect much
   --------------------------------------------------------------------------- */

export const PREVENTION = [
  {
    title: "Get children outdoors — about two hours a day",
    evidence: 4,
    what:
      "Time outdoors delays the onset of short-sightedness in children. Randomised school-based trials in Guangzhou and Taiwan cut new myopia by roughly a quarter to a third by adding outdoor time to the school day, and the effect appears to come from bright light rather than distance viewing.",
    who: "Every child, but especially those with two myopic parents.",
  },
  {
    title: "Treat progressing myopia, don't just correct it",
    evidence: 4,
    what:
      "Once a child is myopic and progressing, several treatments slow the elongation of the eye by roughly 30–60%: low-dose atropine drops, orthokeratology, and defocus-incorporating spectacle lenses or dual-focus soft contact lenses. Ordinary single-vision glasses do not slow anything — they only sharpen the image.",
    who: "Children and teenagers whose prescription is climbing. Every dioptre prevented lowers lifetime risk of retinal detachment, myopic maculopathy and glaucoma.",
  },
  {
    title: "Stop smoking",
    evidence: 4,
    what:
      "Smoking multiplies the risk of macular degeneration two- to four-fold and brings it on years earlier; it accelerates cataract, and it is the strongest modifiable driver of thyroid eye disease severity. Risk falls measurably after quitting.",
    who: "Everyone. This is the single largest modifiable risk factor for irreversible sight loss.",
  },
  {
    title: "Control glucose and blood pressure if you have diabetes",
    evidence: 4,
    what:
      "The DCCT showed intensive glucose control cut retinopathy progression by more than half; the UKPDS added the effect of blood pressure control. This is the best-evidenced prevention in all of ophthalmology.",
    who: "Everyone with type 1 or type 2 diabetes, from diagnosis.",
  },
  {
    title: "Attend diabetic eye screening every year",
    evidence: 4,
    what:
      "Diabetic retinopathy is entirely symptomless until it is advanced. National screening programmes with photographic grading have measurably reduced blindness — not by treating anything, but by finding treatable disease before it is felt.",
    who: "Everyone with diabetes, annually, whether or not vision seems fine.",
  },
  {
    title: "Wear real eye protection for DIY, grinding and sport",
    evidence: 4,
    what:
      "Certified safety eyewear prevents the great majority of open globe injuries, hyphaemas and corneal foreign bodies. Hammering metal on metal, angle-grinding, strimming and squash are the classic mechanisms — and the injuries are frequently permanent.",
    who: "Anyone with a power tool, a racquet, a paintball marker or a lawnmower. Prescription glasses are not eye protection.",
  },
  {
    title: "Never sleep in contact lenses, never let them touch water",
    evidence: 4,
    what:
      "Sleeping in lenses raises the risk of microbial keratitis several-fold, and tap or shower water is how Acanthamoeba — the most destructive corneal infection there is — gets in. Replace lenses on schedule and the case monthly.",
    who: "Every lens wearer. Keep glasses so lenses are never your only option, and if a lens-wearing eye turns red and painful, take the lens out and be seen the same day.",
  },
  {
    title: "Have your eyes examined on a schedule, not on symptoms",
    evidence: 4,
    what:
      "Glaucoma, ocular hypertension, diabetic retinopathy, choroidal melanoma and a chiasmal tumour can all be present with no symptoms whatsoever. A dilated examination with pressure measurement, disc assessment and fields is how they are found while still treatable.",
    who: "Every 2 years as an adult; annually from 60, or from 40 with African or Caribbean ancestry, a family history of glaucoma, diabetes, or high myopia.",
  },
  {
    title: "Get a child's eyes checked before school",
    evidence: 4,
    what:
      "Amblyopia is treatable while the visual system is still developing and becomes far harder to treat after about age seven. Preschool screening exists for exactly this window, and children almost never complain — they have nothing to compare with.",
    who: "Every child. A newborn needs a red-reflex check; any constant squint after four months, or a white pupil in a photograph, is a same-week referral.",
  },
  {
    title: "Have the shingles vaccine after 50",
    evidence: 4,
    what:
      "The recombinant zoster vaccine substantially reduces shingles and post-herpetic neuralgia. Herpes zoster ophthalmicus can inflame every layer of the eye and leave chronic pain and corneal scarring.",
    who: "Adults over 50, per local immunisation schedules.",
  },
  {
    title: "Never use steroid eye drops without an examination",
    evidence: 4,
    what:
      "Steroid drops on a herpetic ulcer turn a treatable dendritic ulcer into a scarring geographic one. They also raise pressure in about a third of people and accelerate cataract. Leftover drops from a previous episode are a recurring cause of avoidable sight loss.",
    who: "Anyone with a red eye. Get the slit-lamp examination first, every time.",
  },
  {
    title: "Wear UV-blocking wraparound sunglasses and a brimmed hat",
    evidence: 3,
    what:
      "Cumulative ultraviolet exposure causes pterygium, photokeratitis and cortical cataract, and is linked to macular degeneration and ocular surface cancers. Wraparound designs matter because light also enters from the side. Snow and water reflect more UV than they absorb.",
    who: "Everyone, from childhood — much of the lifetime dose is taken before adulthood. Essential for outdoor workers and on snow or water.",
  },
  {
    title: "Stop rubbing your eyes",
    evidence: 3,
    what:
      "Chronic rubbing is the leading modifiable risk factor for keratoconus, particularly in children with allergic eye disease, and it can accelerate progression in an already thin cornea. Treat the itch instead of scratching it.",
    who: "Especially atopic children and anyone with keratoconus, or who has had laser refractive surgery.",
  },
  {
    title: "Check each eye separately on an Amsler grid if you have AMD",
    evidence: 3,
    what:
      "Dry macular degeneration converting to the wet form is treatable with anti-VEGF injections — but the outcome depends on how fast treatment starts. Weekly self-monitoring, one eye at a time, is what turns 'sudden' distortion into a same-week appointment.",
    who: "Anyone with drusen or diagnosed AMD. One eye covered at a time, because the other one hides the defect.",
  },
  {
    title: "Take AREDS2 supplements only for intermediate AMD",
    evidence: 3,
    what:
      "The AREDS2 formulation reduced progression to advanced AMD by around 25% — but only in people who already had intermediate disease or advanced disease in one eye. It does nothing preventive for healthy eyes or for early AMD, and beta-carotene was removed because it raised lung cancer risk in smokers.",
    who: "Prescribed for a specific stage of a specific disease, not a general eye vitamin.",
  },
  {
    title: "Eat leafy greens and oily fish",
    evidence: 2,
    what:
      "Lutein and zeaxanthin are the pigments that make up the macula's own light filter, and diets high in them and in omega-3 are associated with less advanced AMD in cohort studies. Trials of supplements alone have been much less convincing than the dietary pattern.",
    who: "Reasonable for everyone; not a substitute for not smoking.",
  },
  {
    title: "Blink properly during screen work, and blame the tear film",
    evidence: 2,
    what:
      "Blink rate drops sharply during concentrated screen use and the tear film breaks up, which is what causes the burning, grittiness and fluctuating blur of 'digital eye strain'. Regular breaks — the 20-20-20 habit — plus complete blinks and moving air vents away from the face genuinely help the symptoms.",
    who: "Screen workers. Note what this does not do: screen time does not damage the retina, and it is near-work in children, not screens in adults, that relates to myopia.",
  },
  {
    title: "Get sleep apnoea treated",
    evidence: 2,
    what:
      "Obstructive sleep apnoea is associated with normal-tension glaucoma, non-arteritic optic neuropathy, central serous chorioretinopathy and floppy eyelid syndrome. The association is consistent; evidence that treating it protects vision is still limited.",
    who: "Worth pursuing if you snore heavily and have any of those diagnoses.",
  },
];

export const MYTHS = [
  {
    claim: "Blue-light filtering glasses protect your eyes and reduce strain",
    verdict:
      "Randomised trials and a Cochrane review find no meaningful effect on eye strain, visual performance or sleep, and no evidence of retinal protection at screen-level intensities. Screen brightness, blink rate and an uncorrected prescription explain the symptoms.",
  },
  {
    claim: "Eye exercises can cure short-sightedness",
    verdict:
      "Myopia is the physical length of the eyeball measured against its optical power. No exercise shortens an eyeball. Vergence therapy is genuinely effective — but for convergence insufficiency, which is a different problem.",
  },
  {
    claim: "Reading in dim light or sitting close to the TV damages your eyes",
    verdict:
      "Neither causes lasting damage. Dim light makes reading effortful and eyes tired; a child sitting very close to the screen is more likely reporting undiagnosed myopia than causing it.",
  },
  {
    claim: "Wearing glasses makes your eyes lazy or dependent",
    verdict:
      "Correcting focus does not weaken the eye. In children, the opposite is true: leaving significant refractive error uncorrected causes amblyopia and squint.",
  },
  {
    claim: "Carrots will improve your vision",
    verdict:
      "Vitamin A deficiency genuinely causes night blindness, and correcting it restores vision — that is a real and important effect in malnutrition. But adding more vitamin A to an already sufficient diet improves nothing, and in Stargardt disease it makes things worse.",
  },
  {
    claim: "Cataracts can be dissolved with drops",
    verdict:
      "No drop reverses protein aggregation in the lens. Surgery replaces the lens, takes about fifteen minutes, and is among the most successful operations in medicine.",
  },
];

export const RED_FLAGS = [
  {
    sign: "Sudden loss of vision in one eye, painless",
    why: "Retinal artery occlusion — a stroke of the eye — or giant cell arteritis, which can blind the other eye within days.",
  },
  {
    sign: "A curtain, shadow or dark area moving across your vision",
    why: "Retinal detachment. The macula's survival sets the ceiling on final vision, so hours matter.",
  },
  {
    sign: "A sudden shower of new floaters, with flashing lights",
    why: "Vitreous detachment with a possible retinal tear. Laser now prevents surgery later.",
  },
  {
    sign: "Straight lines suddenly looking bent or wavy",
    why: "Wet macular degeneration. Highly treatable early, not treatable once it has scarred.",
  },
  {
    sign: "Severe eye pain with haloes around lights, nausea or vomiting",
    why: "Acute angle-closure glaucoma. Pressure can destroy the optic nerve in a day, and the vomiting often misdirects the diagnosis.",
  },
  {
    sign: "A red, painful eye in a contact lens wearer",
    why: "Microbial keratitis. Pseudomonas can perforate a cornea in 48 hours. Remove the lens and be seen today.",
  },
  {
    sign: "New double vision, especially with a drooping lid or a large pupil",
    why: "Third nerve palsy from an aneurysm, or giant cell arteritis. Same-day imaging.",
  },
  {
    sign: "Any chemical splash in the eye",
    why: "Irrigate immediately for 15–30 minutes before travelling anywhere. Alkalis keep burning as long as they are present.",
  },
  {
    sign: "Injury from hammering, grinding or a high-speed particle",
    why: "Possible open globe or intraocular foreign body. Shield the eye, apply no pressure, do not irrigate, go to hospital.",
  },
  {
    sign: "New headache with vision loss in someone over 50",
    why: "Giant cell arteritis. Steroids started the same day protect the second eye. Do not wait for a biopsy.",
  },
  {
    sign: "A white pupil in a flash photograph of a child, or a new squint",
    why: "Retinoblastoma, congenital cataract or another cause of amblyopia. Urgent referral, never a wait-and-see.",
  },
  {
    sign: "Painful blistering rash on the forehead or nose with a red eye",
    why: "Herpes zoster ophthalmicus. Antivirals within 72 hours change the outcome.",
  },
];

export const EXAM_INTERVALS = [
  { group: "Newborn", interval: "Red-reflex check at birth and at 6–8 weeks", note: "Screens for congenital cataract and retinoblastoma" },
  { group: "Preschool (3–5 yrs)", interval: "Vision screening once", note: "The amblyopia treatment window is closing" },
  { group: "School age", interval: "Every 1–2 years", note: "Myopia onset and progression; earlier if parents are myopic" },
  { group: "Adults 18–39", interval: "Every 2 years", note: "Sooner for symptoms, contact lens wear or injury" },
  { group: "Adults 40–59", interval: "Every 2 years", note: "Presbyopia begins; glaucoma screening starts to matter" },
  { group: "Adults 60+", interval: "Annually", note: "Cataract, AMD and glaucoma all rise steeply with age" },
  { group: "Diabetes, any age", interval: "Annually from diagnosis", note: "More often in pregnancy or if retinopathy is present" },
  { group: "Family history of glaucoma", interval: "Annually from 40", note: "From 35 with African or Caribbean ancestry" },
  { group: "High myopia (over −6 D)", interval: "Annually, dilated", note: "Peripheral retina, macula and pressure" },
  { group: "On hydroxychloroquine", interval: "Baseline, then annually after 5 years", note: "OCT and visual fields; dose by actual body weight" },
];
