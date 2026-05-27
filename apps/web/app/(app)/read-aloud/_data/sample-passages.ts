/* ── TOEIC Sample Passages — organised by topic & length ── */
export type SampleLength = "short" | "medium" | "long";
export type SampleTopic = string;

export interface SampleText {
  title: string;
  topic: SampleTopic;
  length: SampleLength;
  icon: string;
  text: string;
}

export const TOEIC_TOPICS = [
  { key: "office", label: "Office", icon: "🏢" },
  { key: "hr", label: "Human Resources", icon: "👥" },
  { key: "finance", label: "Finance", icon: "💰" },
  { key: "marketing", label: "Marketing", icon: "📣" },
  { key: "travel", label: "Travel", icon: "✈️" },
  { key: "dining", label: "Dining", icon: "🍽️" },
  { key: "health", label: "Health", icon: "🏥" },
  { key: "technology", label: "Technology", icon: "💻" },
  { key: "manufacturing", label: "Manufacturing", icon: "🏭" },
  { key: "realestate", label: "Real Estate", icon: "🏠" },
] as const;

export const SAMPLE_TEXTS: SampleText[] = [
  // ── Office & Workplace ──
  {
    title: "Morning Briefing",
    topic: "office",
    length: "short",
    icon: "🏢",
    text: "Good morning, everyone. Before we start today's meeting, I'd like to remind all staff members that the monthly report is due by Friday afternoon.",
  },
  {
    title: "Office Maintenance Notice",
    topic: "office",
    length: "medium",
    icon: "🏢",
    text: "Please be advised that the building management team will be conducting routine maintenance on the air conditioning system this Saturday. All employees are requested to ensure that their windows are closed and personal belongings are secured before leaving on Friday evening. We apologize for any inconvenience this may cause.",
  },
  {
    title: "Remote Work Policy",
    topic: "office",
    length: "long",
    icon: "🏢",
    text: "Following the recent survey results, the management team has decided to implement a hybrid work policy starting next quarter. Employees will be required to work in the office at least three days per week, while the remaining two days can be spent working remotely from home. All team leaders are expected to coordinate schedules within their departments to ensure adequate office coverage. Please note that this policy will be reviewed after a six-month trial period, and adjustments may be made based on productivity metrics and employee feedback.",
  },

  // ── Human Resources ──
  {
    title: "Hiring Announcement",
    topic: "hr",
    length: "short",
    icon: "👥",
    text: "We are currently seeking a qualified marketing coordinator to join our expanding team. Interested candidates should submit their résumés by the end of next week.",
  },
  {
    title: "Employee Training Program",
    topic: "hr",
    length: "medium",
    icon: "👥",
    text: "The Human Resources department is pleased to announce a new professional development program for all full-time employees. The program includes workshops on leadership skills, time management, and effective communication. Registration will open on Monday, and spaces are limited to thirty participants per session. Early registration is strongly encouraged.",
  },
  {
    title: "Annual Performance Review",
    topic: "hr",
    length: "long",
    icon: "👥",
    text: "As we approach the end of the fiscal year, all department managers are reminded to complete performance evaluations for their team members by December fifteenth. The evaluation process has been updated this year to include a self-assessment component, which employees should complete before meeting with their supervisors. Managers are encouraged to provide specific, constructive feedback and to discuss career development goals with each team member. The completed evaluation forms must be submitted to the Human Resources department no later than December twenty-second. A training session on the new evaluation criteria will be held next Tuesday at two o'clock in Conference Room B.",
  },

  // ── Finance & Banking ──
  {
    title: "Quarterly Report",
    topic: "finance",
    length: "short",
    icon: "💰",
    text: "Our third-quarter revenue exceeded projections by twelve percent, driven primarily by strong sales in the Asia-Pacific region and increased demand for our premium product line.",
  },
  {
    title: "Refund Policy Update",
    topic: "finance",
    length: "medium",
    icon: "💰",
    text: "Effective January first, our refund policy will be updated to allow customers a thirty-day return window for all purchases made online. Refunds will be processed within five to seven business days after the returned item has been received and inspected at our warehouse. Customers are responsible for return shipping costs unless the item is defective or was shipped incorrectly.",
  },
  {
    title: "New Year Budget Plan",
    topic: "finance",
    length: "long",
    icon: "💰",
    text: "The finance committee has completed its review of the proposed budget for the upcoming fiscal year. After careful analysis of current market conditions and projected growth rates, the committee recommends a fifteen percent increase in the research and development allocation. This investment is expected to support the launch of three new product lines by the third quarter. Additionally, the committee suggests reallocating funds from the travel budget to support the expansion of our digital marketing initiatives. Department heads are invited to submit any objections or alternative proposals by the end of this month. A final budget presentation will be delivered to the board of directors on February tenth.",
  },

  // ── Marketing & Advertising ──
  {
    title: "New Campaign Launch",
    topic: "marketing",
    length: "short",
    icon: "📣",
    text: "Our new social media campaign launches next Monday. The marketing team has prepared engaging content across all major platforms to maximize brand awareness and customer engagement.",
  },
  {
    title: "Target Market Analysis",
    topic: "marketing",
    length: "medium",
    icon: "📣",
    text: "Recent market research indicates that our target demographic has shifted significantly over the past two years. Consumers between the ages of twenty-five and thirty-four now represent our fastest-growing customer segment. The marketing team recommends adjusting our advertising strategy to focus more heavily on digital channels, particularly short-form video content and influencer partnerships, to better reach this audience.",
  },
  {
    title: "Rebranding Plan",
    topic: "marketing",
    length: "long",
    icon: "📣",
    text: "Following extensive consumer research and competitive analysis, our brand strategy team has developed a comprehensive rebranding proposal. The new brand identity will feature a modernized logo, updated color palette, and refreshed messaging that emphasizes sustainability and innovation. The rollout will begin with our digital properties in March, followed by updated packaging and in-store materials in May. All customer-facing communications should transition to the new brand guidelines by the end of June. Regional managers are responsible for ensuring that their local marketing materials comply with the updated standards. A detailed brand toolkit will be distributed to all departments next week.",
  },

  // ── Travel & Transportation ──
  {
    title: "Flight Delay Announcement",
    topic: "travel",
    length: "short",
    icon: "✈️",
    text: "Attention all passengers. Flight seven-two-three to Singapore has been delayed by approximately forty-five minutes due to severe weather conditions. We apologize for the inconvenience.",
  },
  {
    title: "Hotel Booking Instructions",
    topic: "travel",
    length: "medium",
    icon: "✈️",
    text: "For employees traveling on company business, please remember to book accommodations through our approved travel management system. The company will reimburse hotel expenses up to one hundred fifty dollars per night for domestic travel and two hundred dollars for international trips. All receipts must be submitted within ten business days of your return. Late submissions may result in delayed reimbursement.",
  },
  {
    title: "Business Travel Policy",
    topic: "travel",
    length: "long",
    icon: "✈️",
    text: "The company has recently updated its international business travel policy to reflect current global conditions. All employees planning overseas trips must submit their travel requests at least three weeks in advance for approval by their department head and the travel coordinator. Business class airfare is approved for flights exceeding eight hours in duration. Travelers are required to purchase comprehensive travel insurance through our corporate provider. Upon arrival at their destination, employees should register with the local embassy or consulate. A per diem allowance will be provided based on the cost-of-living index of the destination country. Detailed guidelines and the updated expense reporting form are available on the company intranet.",
  },

  // ── Dining & Restaurants ──
  {
    title: "Restaurant Reservation",
    topic: "dining",
    length: "short",
    icon: "🍽️",
    text: "Good evening. I'd like to make a reservation for six people this Saturday at seven o'clock. Could you please seat us near the window if possible?",
  },
  {
    title: "New Seasonal Menu",
    topic: "dining",
    length: "medium",
    icon: "🍽️",
    text: "We are delighted to introduce our new seasonal menu, featuring locally sourced ingredients and contemporary interpretations of classic dishes. Highlights include a roasted butternut squash soup, pan-seared salmon with citrus glaze, and a rich dark chocolate torte for dessert. Our sommelier has also curated a selection of wines to complement each course. Reservations for the tasting event can be made online.",
  },
  {
    title: "Corporate Catering Service",
    topic: "dining",
    length: "long",
    icon: "🍽️",
    text: "Thank you for choosing our catering service for your upcoming corporate event. Based on our discussion, we have prepared a customized menu that accommodates various dietary requirements, including vegetarian, vegan, and gluten-free options. The package includes a welcome reception with canapés and beverages, a three-course seated dinner, and a dessert station. Our team will arrive two hours before the event to set up, and all equipment will be cleared within one hour after the event concludes. Please confirm the final guest count at least five business days in advance. We look forward to making your event a memorable occasion. Should you have any additional requests or modifications, please do not hesitate to contact our events coordinator.",
  },

  // ── Health & Wellness ──
  {
    title: "Health Screening Reminder",
    topic: "health",
    length: "short",
    icon: "🏥",
    text: "All employees are reminded that the annual health screening will take place next Thursday in the first-floor conference room. Please fast for eight hours before your appointment.",
  },
  {
    title: "Employee Wellness Program",
    topic: "health",
    length: "medium",
    icon: "🏥",
    text: "Our company wellness program has been expanded to include complimentary gym memberships, weekly yoga classes, and monthly nutrition workshops. Employees who participate in at least three wellness activities per quarter will be eligible for a premium discount on their health insurance. Sign-up sheets are available at the front desk, and more information can be found on the employee benefits portal.",
  },
  {
    title: "Workplace Safety Guidelines",
    topic: "health",
    length: "long",
    icon: "🏥",
    text: "In accordance with updated workplace safety regulations, all employees working in the warehouse and manufacturing areas are required to complete a refresher training course on proper equipment handling and emergency procedures. The training sessions will be held during the first two weeks of January, and attendance is mandatory. Topics covered will include the correct use of personal protective equipment, fire evacuation routes, first aid basics, and the reporting process for workplace injuries. Employees who have not completed the training by the deadline will not be permitted to access restricted work areas. Please check the schedule posted on the bulletin board and register for a session that fits your shift. Supervisors are responsible for ensuring full participation from their teams.",
  },

  // ── Technology & IT ──
  {
    title: "System Upgrade Scheduled",
    topic: "technology",
    length: "short",
    icon: "💻",
    text: "The IT department will perform a scheduled system upgrade this weekend. All internal applications will be unavailable from Saturday evening until Sunday morning.",
  },
  {
    title: "Data Security Protocols",
    topic: "technology",
    length: "medium",
    icon: "💻",
    text: "In response to recent cybersecurity threats, the IT security team has implemented new data protection protocols. All employees must now use two-factor authentication when accessing company systems remotely. Passwords must be changed every sixty days and must include a combination of uppercase letters, lowercase letters, numbers, and special characters. Please contact the IT help desk if you experience any difficulties with the new security measures.",
  },
  {
    title: "New ERP Software Rollout",
    topic: "technology",
    length: "long",
    icon: "💻",
    text: "We are pleased to announce the rollout of our new enterprise resource planning software, which will replace the current legacy system by the end of the second quarter. The new platform offers improved functionality for inventory management, customer relationship tracking, and financial reporting. A series of training workshops will be conducted throughout March and April to ensure a smooth transition. Each department will receive customized training tailored to their specific workflow requirements. During the transition period, both systems will run simultaneously to prevent any disruption to daily operations. All employees are expected to complete the online orientation module before attending their assigned workshop. Technical support staff will be available around the clock during the first week of full deployment to address any issues promptly.",
  },

  // ── Manufacturing & Production ──
  {
    title: "Production Report",
    topic: "manufacturing",
    length: "short",
    icon: "🏭",
    text: "Production output for the month of October increased by eight percent compared to the previous quarter, largely due to the installation of new automated assembly equipment.",
  },
  {
    title: "Quality Control Inspection",
    topic: "manufacturing",
    length: "medium",
    icon: "🏭",
    text: "The quality assurance department has introduced a new inspection protocol for all products leaving our manufacturing facility. Each batch will now undergo a three-stage testing process before being approved for shipment. Products that do not meet our strict quality standards will be flagged for review and may be returned to the production line for rework. This measure is expected to reduce customer complaints by approximately twenty percent.",
  },
  {
    title: "Manufacturing Plant Expansion",
    topic: "manufacturing",
    length: "long",
    icon: "🏭",
    text: "Following the board's approval last month, construction of our new manufacturing facility in the southern industrial zone will commence in early February. The forty-thousand-square-foot plant will house state-of-the-art production lines capable of manufacturing up to ten thousand units per day. The project is expected to be completed within eighteen months and will create approximately three hundred new jobs in the region. During the construction phase, our current facility will continue to operate at full capacity to meet existing customer demand. A dedicated project management team has been assembled to oversee the construction timeline and budget. Regular progress updates will be provided to all stakeholders through monthly briefings and quarterly reports.",
  },

  // ── Real Estate & Housing ──
  {
    title: "Apartment for Lease",
    topic: "realestate",
    length: "short",
    icon: "🏠",
    text: "A newly renovated two-bedroom apartment is available for lease starting next month. The unit features modern appliances, hardwood floors, and a private balcony with city views.",
  },
  {
    title: "Homebuyer's Guide",
    topic: "realestate",
    length: "medium",
    icon: "🏠",
    text: "For first-time homebuyers, navigating the mortgage process can seem overwhelming. It is advisable to obtain pre-approval from your bank before beginning your property search. This will give you a clear understanding of your budget and demonstrate to sellers that you are a serious buyer. Additionally, working with a licensed real estate agent can help you identify suitable properties and negotiate favorable terms on your behalf.",
  },
  {
    title: "Waterfront Urban Development",
    topic: "realestate",
    length: "long",
    icon: "🏠",
    text: "The city planning commission has approved a major mixed-use development project in the downtown waterfront district. The development will include two hundred residential units ranging from studio apartments to three-bedroom family homes, along with fifteen thousand square feet of retail space on the ground floor. The design incorporates sustainable building practices, including solar panels, rainwater harvesting systems, and energy-efficient insulation. A public park and pedestrian promenade will connect the development to the existing waterfront trail. Construction is scheduled to begin in the spring, with the first phase of residential units expected to be available for occupancy within two years. Interested buyers can register for priority viewing at the developer's sales office, which opens next Monday.",
  },
];
