import json
from backend.database import crud, db

def seed_demo_data():
    """Seeds rich, realistic reference investigations for immediate demonstration."""
    db.init_db()

    # Investigation 1: Nuclear vs Solar
    inv1_id = "demo-india-energy-2035"
    existing1 = crud.get_investigation(inv1_id)
    if not existing1:
        crud.create_investigation(
            question="Should India prioritize nuclear energy or solar energy over the next 10 years?",
            topic="Clean Energy & Grid Transition",
            geographical_scope="India (National Grid)",
            time_horizon="2025-2035 (10 Years)",
            investigation_id=inv1_id
        )
        
        crud.update_investigation_status(
            inv_id=inv1_id,
            status="completed",
            summary="Autonomous investigation synthesized 6 primary sources, 8 claims, and challenged baseload intermittency vs capital gestation tradeoffs.",
            recommendation="Solar Energy with Battery Storage",
            reasoning="Solar Energy with Battery Storage is the preferred strategic path with an aggregate score of 8.21 / 10.0 (leads by +0.76 pts). Driven primarily by superiority in Economic Feasibility and Scalability & Deployment Speed, offsetting disadvantages in long-term baseload stability."
        )

        alt_solar = crud.add_alternative(inv1_id, "Solar Energy with Battery Storage", "Rapid decentralized deployment of utility-scale and rooftop solar PV paired with 4-hour battery energy storage systems (BESS).", alt_id=f"{inv1_id}_alt_solar")
        alt_nuclear = crud.add_alternative(inv1_id, "Nuclear Power Expansion", "Baseload indigenous Pressurized Heavy Water Reactors (PHWR-700) and Small Modular Reactors (SMRs).", alt_id=f"{inv1_id}_alt_nuclear")

        # Sources
        s1 = crud.add_source(
            inv1_id,
            "Central Electricity Authority: National Electricity Plan 2022-2032",
            "https://cea.nic.in/reports/nep-generation-2022-32",
            "Central Electricity Authority, Ministry of Power, Govt of India",
            "2023-05-15",
            "India targets 500 GW non-fossil capacity by 2030, with solar contributing 292 GW. Current nuclear capacity is 7.48 GW with plans to reach 22.4 GW by 2031-32. Solar levelized tariffs range from INR 2.30 to 2.60 per kWh, whereas nuclear capital costs average INR 15-20 crore per MW with gestation periods of 8 to 12 years.",
            "government", 0.98, f"{inv1_id}_src_cea"
        )

        s2 = crud.add_source(
            inv1_id,
            "IPCC Working Group III: Life Cycle Emissions and Capacity Factors",
            "https://www.ipcc.ch/report/ar6/wg3/energy-systems",
            "Intergovernmental Panel on Climate Change (IPCC)",
            "2022-04-04",
            "Median lifecycle greenhouse gas emissions for nuclear power are 12 g CO2eq/kWh, lower than utility-scale solar PV (48 g CO2eq/kWh including battery mineral supply chain). Nuclear operates with a 85-90% capacity factor, providing continuous zero-carbon baseload without requiring weather backup.",
            "academic", 0.96, f"{inv1_id}_src_ipcc"
        )

        s3 = crud.add_source(
            inv1_id,
            "Brookings India: Land and Water Constraints in Grid Decarbonization",
            "https://www.brookings.edu/research/renewable-energy-land-water-tradeoffs-india",
            "Brookings Institution",
            "2023-09-10",
            "Solar parks require 5 to 10 acres of land per MW, generating friction in densely populated agrarian states. Nuclear plants require less than 0.1 acres per MW but face local public resistance and high freshwater/seawater cooling requirements.",
            "policy_institute", 0.92, f"{inv1_id}_src_brookings"
        )

        # Claims & Evidence
        c1 = crud.add_claim(
            inv1_id,
            "Solar PV tariffs in India have dropped to INR 2.30-2.60/kWh, representing the lowest generation cost on the grid.",
            alt_solar, "Verified support", "verified",
            "Substantiated by CEA auction results and Ministry of Power tariff filings.",
            "Data Research Agent", f"{inv1_id}_c1"
        )
        crud.add_evidence(c1, s1, "supporting", "Solar levelized tariffs range from INR 2.30 to 2.60 per kWh.", "Official CEA tariff records.")

        c2 = crud.add_claim(
            inv1_id,
            "Nuclear power exhibits >85% capacity factor, eliminating the intermittency and dark-doldrums penalties of solar.",
            alt_nuclear, "Verified support", "verified",
            "Confirmed by international nuclear operational benchmarks and IPCC AR6 data.",
            "Literature Research Agent", f"{inv1_id}_c2"
        )
        crud.add_evidence(c2, s2, "supporting", "Nuclear operates with a 85-90% capacity factor.", "IPCC lifecycle and capacity analysis.")

        c3 = crud.add_claim(
            inv1_id,
            "Adding 4-hour battery storage to solar to provide firm evening peaking doubles the effective dispatch tariff to INR 4.80-6.20/kWh.",
            alt_solar, "Partial support", "partial",
            "Economic models show battery degradation and cycling costs significantly increase firm dispatch tariffs.",
            "Critic Agent", f"{inv1_id}_c3"
        )
        crud.add_evidence(c3, s1, "contradicting", "Dispatchable renewables with storage require tariff escalation beyond pure solar auctions.", "Critic Agent stress-test.")

        c4 = crud.add_claim(
            inv1_id,
            "Nuclear reactor builds in India suffer from an average 9.6-year gestation delay, tying up state capital and deferring clean megawatts.",
            alt_nuclear, "Verified support", "verified",
            "Historical project audit of Kakrapar, Kudankulam, and Gorakhpur plants demonstrates persistent scheduling overruns.",
            "Market Research Agent", f"{inv1_id}_c4"
        )
        crud.add_evidence(c4, s1, "supporting", "Nuclear gestation periods of 8 to 12 years average.", "CEA historical timeline audit.")

        c5 = crud.add_claim(
            inv1_id,
            "Solar land acquisition requires 5-10 acres/MW, which will hit acute availability bottlenecks in northern and eastern states.",
            alt_solar, "Verified support", "verified",
            "Corroborated by spatial geospatial analysis in Brookings research.",
            "Critic Agent", f"{inv1_id}_c5"
        )
        crud.add_evidence(c5, s3, "supporting", "Solar parks require 5 to 10 acres of land per MW.", "Brookings land-use audit.")

        # Scores
        crud.clear_scores(inv1_id)
        scores_data = [
            (alt_solar, "Economic Feasibility", 8.8, 0.25, 2.20, "Lowest levelized cost of energy (LCOE) and private capital liquidity."),
            (alt_nuclear, "Economic Feasibility", 6.2, 0.25, 1.55, "High upfront capital intensity and sovereign guarantee requirements."),
            (alt_solar, "Environmental & Lifecycle Impact", 8.2, 0.25, 2.05, "Zero direct operational emissions; mineral supply chain and land footprint."),
            (alt_nuclear, "Environmental & Lifecycle Impact", 8.6, 0.25, 2.15, "Lowest lifecycle carbon (12g CO2/kWh) and minimal physical footprint."),
            (alt_solar, "Scalability & Deployment Speed", 9.2, 0.20, 1.84, "Modular deployment completed in 12-18 months per phase."),
            (alt_nuclear, "Scalability & Deployment Speed", 5.2, 0.20, 1.04, "8-12 year commissioning timelines and rigorous safety zoning."),
            (alt_solar, "Long-term Sustainability", 7.6, 0.20, 1.52, "Intermittent generation requiring grid balancing and battery renewal cycles."),
            (alt_nuclear, "Long-term Sustainability", 8.9, 0.20, 1.78, "60+ year continuous baseload operation independent of season or weather."),
            (alt_solar, "Implementation Feasibility", 8.0, 0.10, 0.80, "Broad state support, streamlined grid codes, and public consensus."),
            (alt_nuclear, "Implementation Feasibility", 6.5, 0.10, 0.65, "Civil liability complexities and localized public siting friction.")
        ]
        for a_id, crit, raw, wt, wtd, expl in scores_data:
            crud.save_score(inv1_id, a_id, crit, raw, wt, wtd, expl)

        # Scenarios
        crud.save_scenario(
            inv1_id, "Optimistic Tech Leap",
            {"tech_cost_change": -0.40, "deployment_speed_mult": 1.5, "baseload_reliability_premium": 0.1, "capex_inflation": -0.10, "carbon_tax_support": 0.5},
            {"description": "Battery costs drop 40%, accelerating solar+storage cost leadership to 8.75 / 10.0.", "preferred": "Solar Energy with Battery Storage"}
        )
        crud.save_scenario(
            inv1_id, "High-Growth Baseload Crunch",
            {"tech_cost_change": 0.05, "deployment_speed_mult": 0.9, "baseload_reliability_premium": 0.90, "capex_inflation": 0.15, "carbon_tax_support": 0.2},
            {"description": "Industrial power consumption spikes 70%, putting severe reliability premiums on 24/7 continuous dispatch. Nuclear overtakes Solar (7.98 vs 7.62).", "preferred": "Nuclear Power Expansion"}
        )

        # Agents
        crud.init_agents_for_investigation(inv1_id)
        crud.update_agent_status(inv1_id, "Research Planner", "completed", "Decomposed into 2 competing alternatives and 5 criteria.", findings_count=7)
        crud.update_agent_status(inv1_id, "Literature Research Agent", "completed", "Retrieved peer-reviewed IPCC and lifecycle energy studies.", findings_count=3)
        crud.update_agent_status(inv1_id, "Data Research Agent", "completed", "Extracted official CEA tariff filings and LCOE data.", findings_count=4)
        crud.update_agent_status(inv1_id, "Market Research Agent", "completed", "Evaluated private capital, vendor supply chains, and build cycles.", findings_count=3)
        crud.update_agent_status(inv1_id, "Impact Research Agent", "completed", "Assessed land requirements, water consumption, and emissions.", findings_count=3)
        crud.update_agent_status(inv1_id, "Critic Agent", "completed", "Surfaced storage cost escalation and nuclear gestation delays.", findings_count=4)
        crud.update_agent_status(inv1_id, "Evidence Verification Agent", "completed", "Verified claims against primary government and academic documents.", findings_count=5)
        crud.update_agent_status(inv1_id, "Contradiction Finder", "completed", "Identified divergence between standalone solar LCOE and firm dispatch cost.", findings_count=2)
        crud.update_agent_status(inv1_id, "Decision Engine", "completed", "Computed deterministic score: Solar leads by +0.76 pts.", findings_count=5)

    # Investigation 2: EV Battery Swapping vs Fast Charging
    inv2_id = "demo-india-ev-infra"
    existing2 = crud.get_investigation(inv2_id)
    if not existing2:
        crud.create_investigation(
            question="Should India prioritize EV battery swapping or fast-charging infrastructure?",
            topic="Electric Mobility & Grid Infrastructure",
            geographical_scope="Urban Centers & Highway Corridors, India",
            time_horizon="2025-2032 (7 Years)",
            investigation_id=inv2_id
        )
        
        crud.update_investigation_status(
            inv_id=inv2_id,
            status="completed",
            summary="Autonomous multi-agent investigation comparing turnaround time, interoperability, battery standardization, and grid peak load stress.",
            recommendation="Battery Swapping Infrastructure",
            reasoning="Battery Swapping Infrastructure is currently preferred for two- and three-wheel commercial fleets with an aggregate score of 7.95 / 10.0 (+0.45 pts over Fast Charging). However, Scenario Lab demonstrates this recommendation flips if 4-wheeler passenger vehicle fast-charging standards unify."
        )

        alt_swap = crud.add_alternative(inv2_id, "Battery Swapping Infrastructure", "Standardized modular battery swap stations focusing on 2-wheeler, 3-wheeler, and commercial delivery fleets.", alt_id=f"{inv2_id}_alt_swap")
        alt_charge = crud.add_alternative(inv2_id, "High-Power Fast Charging Corridors", "Ultra-fast DC charging hubs (50kW-150kW CCS2) deployed along major transit arteries.", alt_id=f"{inv2_id}_alt_charge")

        s1 = crud.add_source(
            inv2_id,
            "NITI Aayog: Draft Battery Swapping Policy Framework",
            "https://www.niti.gov.in/battery-swapping-policy-framework",
            "NITI Aayog, Government of India",
            "2022-11-20",
            "Battery swapping decouples the upfront battery cost (which represents 40-50% of the EV price) from the vehicle purchase, making two-wheelers and three-wheelers instantly cost-competitive with ICE vehicles. Swapping takes under 2 minutes, resolving urban downtime concerns for commercial fleets.",
            "government", 0.98, f"{inv2_id}_src_niti"
        )
        s2 = crud.add_source(
            inv2_id,
            "BloombergNEF: Interoperability Challenges in EV Charging Architectures",
            "https://about.bnef.com/electric-vehicle-outlook-infrastructure",
            "BloombergNEF",
            "2023-08-14",
            "Automakers resist universal battery pack standardization to protect thermal management and proprietary battery design IP. Fast charging adheres to international open standards (CCS2) compatible across brands.",
            "market_research", 0.94, f"{inv2_id}_src_bnef"
        )

        c1 = crud.add_claim(
            inv2_id,
            "Battery swapping reduces driver turnaround time to under 2 minutes, eliminating commercial vehicle downtime.",
            alt_swap, "Verified support", "verified",
            "Confirmed by NITI Aayog field performance benchmarks for 2W/3W fleets.",
            "Data Research Agent", f"{inv2_id}_c1"
        )
        crud.add_evidence(c1, s1, "supporting", "Swapping takes under 2 minutes, resolving urban downtime.", "NITI Aayog field assessment.")

        c2 = crud.add_claim(
            inv2_id,
            "Major automakers resist standardization of battery pack form factors, creating proprietary lock-in risks for swapping networks.",
            alt_swap, "Verified support", "verified",
            "Documented by BloombergNEF industry surveys across global automotive manufacturers.",
            "Critic Agent", f"{inv2_id}_c2"
        )
        crud.add_evidence(c2, s2, "supporting", "Automakers resist universal battery pack standardization.", "Critic Agent interoperability audit.")

        # Scores
        crud.clear_scores(inv2_id)
        scores_ev = [
            (alt_swap, "Economic Feasibility", 8.4, 0.25, 2.10, "Decoupled battery asset purchase reduces upfront retail price by 45%."),
            (alt_charge, "Economic Feasibility", 7.5, 0.25, 1.88, "High vehicle purchase price offset by open universal charging hardware."),
            (alt_swap, "Environmental & Lifecycle Impact", 7.8, 0.25, 1.95, "Centralized charging enables optimal slow-charging battery life extension."),
            (alt_charge, "Environmental & Lifecycle Impact", 7.6, 0.25, 1.90, "Repeated high-current fast charging accelerates cell thermal degradation."),
            (alt_swap, "Scalability & Deployment Speed", 8.5, 0.20, 1.70, "Rapid rollout in dense urban commercial hubs for delivery riders."),
            (alt_charge, "Scalability & Deployment Speed", 7.2, 0.20, 1.44, "Heavy grid transformer upgrade lead times for 150kW+ stations."),
            (alt_swap, "Long-term Sustainability", 6.8, 0.20, 1.36, "Risk of stranded assets if pack chemistry or pack form factors evolve."),
            (alt_charge, "Long-term Sustainability", 8.6, 0.20, 1.72, "Universal CCS2 standard supports passenger cars, SUVs, and commercial trucks."),
            (alt_swap, "Implementation Feasibility", 7.9, 0.10, 0.79, "Strong traction in high-utilization commercial delivery segment."),
            (alt_charge, "Implementation Feasibility", 7.4, 0.10, 0.74, "Requires multi-MW substation grid capacity in congested urban corridors.")
        ]
        for a_id, crit, raw, wt, wtd, expl in scores_ev:
            crud.save_score(inv2_id, a_id, crit, raw, wt, wtd, expl)

        # Scenarios
        crud.save_scenario(
            inv2_id, "Fast-Charging Tech Surge",
            {"tech_cost_change": -0.30, "deployment_speed_mult": 1.4, "baseload_reliability_premium": 0.0, "capex_inflation": -0.20, "carbon_tax_support": 0.0},
            {"description": "Battery costs drop and ultra-fast 350kW charging reaches parity; Fast Charging flips the recommendation.", "preferred": "High-Power Fast Charging Corridors"}
        )

        crud.init_agents_for_investigation(inv2_id)
        crud.update_agent_status(inv2_id, "Research Planner", "completed", "Planned fleet vs passenger transit comparison.", findings_count=5)
        crud.update_agent_status(inv2_id, "Literature Research Agent", "completed", "Evaluated battery thermal cycling degradation.", findings_count=3)
        crud.update_agent_status(inv2_id, "Data Research Agent", "completed", "Extracted 2-minute turnaround time statistics.", findings_count=4)
        crud.update_agent_status(inv2_id, "Market Research Agent", "completed", "Analyzed commercial delivery fleet adoption.", findings_count=3)
        crud.update_agent_status(inv2_id, "Impact Research Agent", "completed", "Assessed transformer substation peak loading.", findings_count=3)
        crud.update_agent_status(inv2_id, "Critic Agent", "completed", "Challenged lack of OEM pack standardization.", findings_count=3)
        crud.update_agent_status(inv2_id, "Evidence Verification Agent", "completed", "Verified claims against NITI Aayog policy.", findings_count=4)
        crud.update_agent_status(inv2_id, "Contradiction Finder", "completed", "Identified 2W/3W commercial fleet vs 4W personal car split.", findings_count=2)
        crud.update_agent_status(inv2_id, "Decision Engine", "completed", "Calculated initial recommendation: Swapping leads by +0.45 pts.", findings_count=5)

    # Investigation 3: Healthcare / Technology (Clinical AI Models)
    inv3_id = "demo-clinical-ai-systems"
    existing3 = crud.get_investigation(inv3_id)
    if not existing3:
        crud.create_investigation(
            question="Should healthcare systems adopt open-source local clinical AI models or proprietary cloud LLM APIs?",
            topic="Healthcare Technology & Clinical AI",
            geographical_scope="Global / Hospital Networks",
            time_horizon="2025-2030 (5 Years)",
            investigation_id=inv3_id
        )
        crud.update_investigation_status(
            inv_id=inv3_id,
            status="completed",
            summary="Synthesized HIPAA compliance audits, inference latency telemetry, and clinical reasoning benchmark studies across 8 leading health systems.",
            recommendation="Open-Source Local Clinical Models",
            reasoning="Open-Source Local Clinical Models lead with an aggregate score of 8.35 / 10.0 (leads by +0.65 pts). Unmatched zero-egress patient privacy compliance and sub-35ms inference latency outweigh raw multi-turn reasoning margins of cloud APIs."
        )
        alt_local = crud.add_alternative(inv3_id, "Open-Source Local Clinical Models", "On-premise quantized medical models (e.g. Med-PaLM, Llama-3-Med) running on sovereign hospital server clusters.", alt_id=f"{inv3_id}_alt_local")
        alt_cloud = crud.add_alternative(inv3_id, "Proprietary Cloud Frontier LLM APIs", "Enterprise cloud clinical APIs (OpenAI, Anthropic, Google Cloud Vertex) with managed compliance BAA agreements.", alt_id=f"{inv3_id}_alt_cloud")

        s1 = crud.add_source(
            inv3_id, "NEJM AI: Patient Data Sovereignty and Zero-Egress Requirements in Clinical AI",
            "https://ai.nejm.org/doi/full/10.1056/AIoa230012", "New England Journal of Medicine AI", "2024-03-12",
            "92% of surveyed healthcare CIOs cite third-party data transmission liabilities as the primary roadblock to generative AI adoption. Airgapped local models eliminate data-in-transit vulnerability and HIPAA breach exposure.",
            "academic", 0.97, f"{inv3_id}_src_nejm"
        )
        s2 = crud.add_source(
            inv3_id, "Stanford Medicine: Diagnostic Accuracy and Hallucination Rates in Multi-Specialty Triage",
            "https://med.stanford.edu/research/clinical-ai-benchmark-2024", "Stanford Center for Biomedical Informatics", "2024-01-20",
            "Frontier cloud models achieve 88.4% diagnostic concordance across rare diseases vs 81.2% for 8B local fine-tuned models. However, local models exhibit 3.2x faster response times (28ms vs 92ms).",
            "academic", 0.95, f"{inv3_id}_src_stanford"
        )

        c1 = crud.add_claim(inv3_id, "Local quantized medical LLMs eliminate all third-party patient data egress, guaranteeing absolute HIPAA and GDPR airgap compliance.", alt_local, "Verified support", "verified", "Validated by NEJM clinical governance research.", "Literature Research Agent", f"{inv3_id}_c1")
        crud.add_evidence(c1, s1, "supporting", "92% of CIOs cite third-party data transmission as primary risk.", "NEJM governance audit.")

        c2 = crud.add_claim(inv3_id, "Frontier cloud LLMs maintain a 7.2% diagnostic accuracy premium on rare pediatric and oncology cases over 8B local parameters.", alt_cloud, "Verified support", "verified", "Documented in Stanford diagnostic evaluations.", "Data Research Agent", f"{inv3_id}_c2")
        crud.add_evidence(c2, s2, "supporting", "Frontier cloud models achieve 88.4% diagnostic concordance.", "Stanford benchmark evaluation.")

        c3 = crud.add_claim(inv3_id, "On-premise GPU clusters create ongoing hardware provisioning, cooling, and ML-engineer staffing burdens for community hospital systems.", alt_local, "Partial support", "partial", "Critic identified total cost of maintenance risks.", "Critic Agent", f"{inv3_id}_c3")
        crud.add_evidence(c3, s1, "contradicting", "Hardware maintenance creates IT complexity.", "Critic Agent stress-test.")

        crud.clear_scores(inv3_id)
        scores_ai = [
            (alt_local, "Economic Feasibility", 8.2, 0.25, 2.05, "Fixed hardware capex beats variable per-token metered API pricing at enterprise scale."),
            (alt_cloud, "Economic Feasibility", 7.6, 0.25, 1.90, "Zero upfront capex but unpredictable recurring operational token expenditures."),
            (alt_local, "Environmental & Lifecycle Impact", 7.9, 0.25, 1.98, "High local hospital power consumption offset by low transmission waste."),
            (alt_cloud, "Environmental & Lifecycle Impact", 7.8, 0.25, 1.95, "Hyperscale datacenter carbon footprint amortized across multi-tenant workloads."),
            (alt_local, "Scalability & Deployment Speed", 8.8, 0.20, 1.76, "Sub-35ms real-time emergency room EHR auto-charting integration."),
            (alt_cloud, "Scalability & Deployment Speed", 7.4, 0.20, 1.48, "Dependent on cloud API gateway latency, rate limits, and network connectivity."),
            (alt_local, "Long-term Sustainability", 8.6, 0.20, 1.72, "Independent from vendor price hikes, API deprecations, or terms-of-service changes."),
            (alt_cloud, "Long-term Sustainability", 7.1, 0.20, 1.42, "Vulnerable to model version drift and proprietary platform lock-in."),
            (alt_local, "Implementation Feasibility", 8.4, 0.10, 0.84, "Instantly passes institutional review board (IRB) patient privacy hurdles."),
            (alt_cloud, "Implementation Feasibility", 6.8, 0.10, 0.68, "Requires complex legal BAA negotiations and security liability waivers.")
        ]
        for a_id, crit, raw, wt, wtd, expl in scores_ai:
            crud.save_score(inv3_id, a_id, crit, raw, wt, wtd, expl)

        crud.init_agents_for_investigation(inv3_id)
        crud.update_agent_status(inv3_id, "Research Planner", "completed", "Formulated clinical privacy vs frontier capability decision.", findings_count=4)
        crud.update_agent_status(inv3_id, "Literature Research Agent", "completed", "Reviewed NEJM and Lancet medical AI governance studies.", findings_count=4)
        crud.update_agent_status(inv3_id, "Data Research Agent", "completed", "Gathered latency telemetry and MMLU clinical sub-scores.", findings_count=3)
        crud.update_agent_status(inv3_id, "Market Research Agent", "completed", "Analyzed hospital CIO procurement budgets and BAA terms.", findings_count=3)
        crud.update_agent_status(inv3_id, "Impact Research Agent", "completed", "Evaluated emergency department EHR triage efficiency.", findings_count=3)
        crud.update_agent_status(inv3_id, "Critic Agent", "completed", "Challenged on-premise hardware obsolescence rates.", findings_count=2)
        crud.update_agent_status(inv3_id, "Evidence Verification Agent", "completed", "Audited claims against HIPAA Omnibus Rule standards.", findings_count=4)
        crud.update_agent_status(inv3_id, "Contradiction Finder", "completed", "Identified divergence between frontier reasoning and emergency latency.", findings_count=2)
        crud.update_agent_status(inv3_id, "Decision Engine", "completed", "Calculated recommendation: Local models lead by +0.65 pts.", findings_count=5)

    # Investigation 4: Defense & Geopolitics (Swarm Interceptors vs Lasers)
    inv4_id = "demo-defense-air-interceptor"
    existing4 = crud.get_investigation(inv4_id)
    if not existing4:
        crud.create_investigation(
            question="Should national defense authorities prioritize autonomous drone swarm interceptors or traditional directed-energy laser systems for low-altitude air defense over the next 5 years?",
            topic="Defense Technology & Autonomous Systems",
            geographical_scope="National Security / Continental Defense",
            time_horizon="2025-2030 (5 Years)",
            investigation_id=inv4_id
        )
        crud.update_investigation_status(
            inv_id=inv4_id,
            status="completed",
            summary="Synthesized theater air-defense battle simulations, cost-exchange ratio analyses, and atmospheric attenuation testing across sovereign test ranges.",
            recommendation="Autonomous Drone Swarm Interceptors",
            reasoning="Autonomous Drone Swarm Interceptors lead with an aggregate score of 8.18 / 10.0 (leads by +0.52 pts). Superior all-weather performance and simultaneous multi-vector swarm saturation survivability outweigh the sub-$50 per-shot cost advantage of directed-energy lasers in adverse atmospheric conditions."
        )
        alt_swarm = crud.add_alternative(inv4_id, "Autonomous Drone Swarm Interceptors", "Distributed modular kinetic and electronic-warfare counter-UAS interceptor swarms using decentralized mesh protocols.", alt_id=f"{inv4_id}_alt_swarm")
        alt_laser = crud.add_alternative(inv4_id, "Directed-Energy Laser Systems", "High-energy solid-state fiber laser turrets (50kW-300kW) for rapid point-defense and infinite magazine depth.", alt_id=f"{inv4_id}_alt_laser")

        s1 = crud.add_source(
            inv4_id, "RUSI: Low-Altitude Counter-UAS Lessons from Modern Armed Conflicts",
            "https://rusi.org/explore-our-research/publications/rusi-defence-systems/c-uas-drone-defense", "Royal United Services Institute", "2023-11-14",
            "Mass low-cost drone saturation exhausts conventional surface-to-air missile inventories within 48 hours. Interceptors must achieve sub-$10,000 cost-exchange parity to be economically sustainable against wave attacks.",
            "think_tank", 0.96, f"{inv4_id}_src_rusi"
        )
        s2 = crud.add_source(
            inv4_id, "IEEE Spectrum: Thermal Blooming and Atmospheric Limits of High-Energy Military Lasers",
            "https://spectrum.ieee.org/military-laser-weapons-atmospheric-limits", "IEEE Spectrum Defense Technology", "2024-02-18",
            "Directed energy weapons face severe beam scattering and thermal blooming in dense fog, rain, or smoke plumes, reducing effective lethal range from 5km to under 800m during adverse weather conditions.",
            "academic", 0.94, f"{inv4_id}_src_ieee"
        )

        c1 = crud.add_claim(inv4_id, "Directed-energy lasers achieve a radical cost-per-engagement below $50 per shot, providing practically infinite magazine depth against single threats.", alt_laser, "Verified support", "verified", "Confirmed by defense contractor test-range telemetry.", "Data Research Agent", f"{inv4_id}_c1")
        crud.add_evidence(c1, s1, "supporting", "Directed-energy achieves sub-$50 engagement costs.", "Operational testing metrics.")

        c2 = crud.add_claim(inv4_id, "Severe atmospheric moisture, fog, and smoke screens degrade solid-state laser lethal engagement range by up to 80%.", alt_laser, "Verified support", "verified", "Documented in IEEE atmospheric optics research.", "Literature Research Agent", f"{inv4_id}_c2")
        crud.add_evidence(c2, s2, "supporting", "Thermal blooming reduces lethal range in rain and fog.", "IEEE atmospheric research.")

        c3 = crud.add_claim(inv4_id, "Drone swarm interceptors operate in all-weather conditions and can engage 40+ inbound saturating threats simultaneously via decentralized edge mesh.", alt_swarm, "Verified support", "verified", "Supported by modern counter-UAS deployment data.", "Market Research Agent", f"{inv4_id}_c3")
        crud.add_evidence(c3, s1, "supporting", "Swarm systems distribute kinetic and EW interceptors simultaneously.", "RUSI theater analysis.")

        crud.clear_scores(inv4_id)
        scores_def = [
            (alt_swarm, "Economic Feasibility", 8.0, 0.25, 2.00, "Commercial off-the-shelf component scaling keeps interceptor cost below $5,000."),
            (alt_laser, "Economic Feasibility", 8.4, 0.25, 2.10, "Sub-$50 per engagement creates unmatched long-term ammunition economics."),
            (alt_swarm, "Environmental & Lifecycle Impact", 7.6, 0.25, 1.90, "Kinetic debris and battery recycling requirements at end-of-life."),
            (alt_laser, "Environmental & Lifecycle Impact", 8.8, 0.25, 2.20, "Zero explosive debris; pure electrical energy generation with zero kinetic fallout."),
            (alt_swarm, "Scalability & Deployment Speed", 8.8, 0.20, 1.76, "Rapid localized manufacturing and fast containerized vehicle deployment."),
            (alt_laser, "Scalability & Deployment Speed", 6.8, 0.20, 1.36, "Complex precision optics, thermal cooling units, and high-power generator requirements."),
            (alt_swarm, "Long-term Sustainability", 8.5, 0.20, 1.70, "Decentralized mesh architecture eliminates single point-of-failure vulnerabilities."),
            (alt_laser, "Long-term Sustainability", 7.2, 0.20, 1.44, "Optical wear, laser diode degradation, and specialized maintenance requirements."),
            (alt_swarm, "Implementation Feasibility", 8.2, 0.10, 0.82, "All-weather tactical deployment ready across mountainous, coastal, and urban terrains."),
            (alt_laser, "Implementation Feasibility", 6.2, 0.10, 0.62, "Constrained to fixed bases or naval platforms due to massive electrical input demands.")
        ]
        for a_id, crit, raw, wt, wtd, expl in scores_def:
            crud.save_score(inv4_id, a_id, crit, raw, wt, wtd, expl)

        crud.init_agents_for_investigation(inv4_id)
        crud.update_agent_status(inv4_id, "Research Planner", "completed", "Planned tactical saturation vs directed-energy trade-off.", findings_count=4)
        crud.update_agent_status(inv4_id, "Literature Research Agent", "completed", "Analyzed IEEE atmospheric optics and beam propagation studies.", findings_count=3)
        crud.update_agent_status(inv4_id, "Data Research Agent", "completed", "Gathered cost-per-shot metrics and saturation thresholds.", findings_count=3)
        crud.update_agent_status(inv4_id, "Market Research Agent", "completed", "Reviewed commercial drone supply chain localization.", findings_count=3)
        crud.update_agent_status(inv4_id, "Impact Research Agent", "completed", "Assessed collateral kinetic debris and power generator demands.", findings_count=3)
        crud.update_agent_status(inv4_id, "Critic Agent", "completed", "Challenged electronic warfare vulnerability of drone swarms.", findings_count=2)
        crud.update_agent_status(inv4_id, "Evidence Verification Agent", "completed", "Verified thermal blooming claims against physics test data.", findings_count=4)
        crud.update_agent_status(inv4_id, "Contradiction Finder", "completed", "Identified clear-day cost vs bad-weather saturation divergence.", findings_count=2)
        crud.update_agent_status(inv4_id, "Decision Engine", "completed", "Calculated recommendation: Drone swarms lead by +0.52 pts.", findings_count=5)
