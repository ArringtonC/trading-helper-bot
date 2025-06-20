# Stock Screening Implementation Guide
## Research Questions & Code Structure - Organized by Development Flow

---

## SECTION A: USER EXPERIENCE & INTERFACE DESIGN
*Start here - the foundation of everything*

### 1. USER FLOW & NAVIGATION STRATEGY

**Research Questions:**
- What's the optimal step-by-step flow from goal-setting to stock selection?
- How do you design intuitive navigation between screening, results, and details?
- What onboarding flows work best for trading apps that don't overwhelm beginners?
- How do you minimize decision fatigue while maintaining functionality?
- What breadcrumb and progress indicators help users understand where they are?
- How do you handle back/forward navigation without losing screening context?
- What shortcuts work for experienced users without confusing beginners?

**Research Findings:**
The most effective trading app flow begins with **goal clarification before technical analysis**. A proven process starts with annual reflection and specific goal setting, where traders identify their objectives and create measurable targets. The optimal workflow follows this sequence:

1. **Initial Goal Definition**: Users set specific, measurable trading goals with clear timeframes rather than vague aspirations
2. **Strategy Alignment**: The system helps users match their goals to appropriate trading strategies based on their risk tolerance and timeline
3. **Market Education**: Progressive disclosure of educational content tailored to the user's experience level
4. **Screening Parameters**: Guided setup of screening criteria that align with established goals
5. **Stock Selection**: Filtered results presentation with clear rationale for recommendations

**Navigation Best Practices:**
- **Tab-based navigation** for main sections (screening, portfolio, research, settings)
- **Breadcrumb trails** for complex hierarchies, especially in screening flows
- **Contextual back buttons** that preserve user's screening parameters
- **Funnel approach**: Industry/Sector Selection → Criteria Refinement → Results Display → Detail Views
- **Parameter persistence**: Save screening criteria in app state or local storage
- **Smart back navigation**: Distinguish between in-stack and cross-stack navigation

**Code Structure:**
```javascript
class UserFlowManager {
  initializeOnboarding(newUser) {}
  manageScreeningSession(userState) {}
  handleNavigation(currentStep, nextStep) {}
  preserveUserContext(sessionData) {}
  createIntegrationLinks(targetSection) {}
  manageProgressIndicators(currentStep, totalSteps) {}
  
  // Context preservation for navigation
  preserveScreeningContext(filters, results) {
    return {
      returnScreen: 'ScreeningResults',
      filters: currentFilters,
      timestamp: Date.now()
    }
  }
}

const USER_JOURNEY = {
  ONBOARDING: 'Goals → Account Level → Preferences',
  SCREENING: 'Simple Filters → Results → Details',
  SELECTION: 'Review → Save → Connect to Broker'
}
```

### 2. SIMPLE VISUAL DESIGN & LAYOUT

**Research Questions:**
- What UI patterns work best for financial apps used by beginners?
- How do you present complex screening data without overwhelming new users?
- What's the optimal information hierarchy for stock screening results?
- Card vs List vs Table layouts - which works best for different user types?
- What color coding systems effectively communicate risk levels and goal alignment?
- How do you use icons and visual cues to quickly communicate stock characteristics?
- What typography hierarchy ensures scannability and comprehension?
- How do you design progressive disclosure to reveal more details as needed?

**Research Findings:**

**UI Patterns for Beginners:**
Financial apps designed for beginners require **simplified interfaces that prioritize usability over advanced functionality**. The most effective patterns include:
- **Minimalistic design approach** that reduces complexity and allows users to focus on managing their finances without distractions
- **Progressive onboarding** with step-by-step guidance through account activation with personalized prompts
- **Familiar interaction patterns** that build on users' smartphone familiarity to reduce learning curve

**Information Hierarchy (Three-Tier System):**
- **Primary Level**: Stock name, current price, and goal match indicators (most prominent)
- **Secondary Level**: Key metrics like risk level, industry classification, and basic performance data
- **Tertiary Level**: Detailed financials, technical analysis data, and advanced metrics (revealed through progressive disclosure)

**Layout Selection by User Type:**
- **Card Views** work best for beginners when users need to focus on individual stock details with multi-dimensional attributes
- **Table Views** excel for advanced users who need to compare objects with attributes directly aligned in scannable columns
- **List Views** serve as middle ground, effective for mobile displays with limited horizontal space

**Color Coding Standards:**
- **Risk Level 1**: Green (#A5D796) - Low risk
- **Risk Level 2**: Blue (#3366CC) - Moderate-low risk  
- **Risk Level 3**: Yellow (#E3B52A) - Moderate risk
- **Risk Level 4**: Orange (#DA7706) - High risk
- **Risk Level 5**: Red (#B90D0D) - Very high risk

**Typography Requirements:**
- **Typography hierarchy should follow a 3:1 ratio for headers to body text size**
- **Modern Sans Serif fonts** (Montserrat, Futura Medium, Overpass) communicate strength, reliability, and stability
- **Visual hierarchy enables viewers to get information quicker** with contrast and spacing having the most influence on effectiveness

**Progressive Disclosure Patterns:**
- **Modal Windows**: Open in front of main UI to provide extra functions
- **Accordions**: Expand and collapse content sections to optimize space
- **Tabs**: Divide content into panels while displaying only one at a time
- **Tooltips**: Reveal extra information when hovered over
- **Limit layers to typically one secondary screen per instance** to avoid confusing users

---

## SECTION B: TRADER GOALS & PERSONALIZATION
*The intelligence that makes screening relevant*

### 4. GOAL IDENTIFICATION & QUESTIONNAIRE DESIGN

**Research Questions:**
- What are the most common trading goals for new traders?
- What questions effectively identify a trader's true objectives vs stated goals?
- How do you design questionnaires that aren't overwhelming for beginners?
- How do you handle conflicting goals (wanting safety AND quick profits)?
- What psychological factors affect goal-setting in trading?
- How do you educate traders on realistic expectations for their account size?
- What onboarding flow best captures goals without intimidating new users?

**Research Findings:**

**Most Common Trading Goals:**
New traders typically enter the market with several key objectives: **building wealth, generating passive income, and achieving financial independence**. However, **many new traders miss out on setting goals, and having clear and realistic goals is important because it helps traders stay focused and motivated**. Research shows that **most traders think in terms of performance instead of result, where results are monetary goals while performance goals focus on risk vs reward, minimizing drawdown or volatility**.

**Five Primary Goal Categories:**
1. **Income Generation**: Focus on **dividend-focused criteria, REIT considerations, utility stocks** with **low payout ratio and respectable current dividend rate**
2. **Growth Seeking**: Emphasis on **small-cap vs large-cap growth, momentum indicators** where **small-cap stocks are generally considered riskier and more profitable than large-cap stocks**
3. **Capital Preservation**: Prioritizing **blue chip stocks, defensive sectors, low-beta stocks** as **defensive investors often include blue-chip stocks due to their perceived reliability**
4. **Learning/Practice**: Utilizing **educational stock picks, mistake-friendly choices** through **paper trading and simulated trading environments**
5. **Active Trading**: Engaging in **day trading setups, volatility plays with appropriate warnings** where **day trading is a high-risk strategy with high chance of losses**

---

## SECTION C: ACCOUNT MANAGEMENT & RISK FRAMEWORK
*Ensuring appropriate recommendations for user's situation*

### 6. ACCOUNT LEVEL CLASSIFICATION

**Research Questions:**
- What are the standard account size tiers used by brokers and trading platforms?
- How should account levels be determined? (Balance only, or balance + experience + trading frequency?)
- What are the risk management guidelines for each account level?
- Should the system allow manual override of auto-detected account levels?
- How do you handle accounts that grow between levels?
- What are appropriate position sizing guidelines for each level?

**Research Findings:**

**Standard Account Tiers:**
Trading platforms typically implement **standardized account tier systems based on regulatory requirements and risk management practices**. The foundation follows regulatory thresholds:

**Regulatory Foundation:**
- **Cash Account Minimum: $0 to open basic accounts, with some requiring up to $2,500 for certain services**
- **Margin Account Minimum: $2,000 as mandated by Regulation T**
- **Pattern Day Trading Threshold: $25,000 minimum equity required** for unlimited day trading
- **Traders who execute four or more day trades within five business days must maintain this balance**

---

## SECTION D: STOCK DISCOVERY & FILTERING LOGIC
*The core screening functionality*

### 8. CURATED STOCK LISTS & BEGINNER-FRIENDLY CATEGORIES

**Research Questions:**
- How do you identify and maintain "stocks of the year" lists?
- What criteria define "stocks to buy early" vs established stocks?
- How do you categorize stocks as "stable" vs "growth" vs "value"?
- What's the best way to show top 2-3 stocks per major industry?
- How do you distinguish between "old stocks" (established) vs "new stocks" (recent IPOs)?
- Should these lists be automated or manually curated?
- How often should curated lists be updated?
- What performance metrics best identify "beginner-friendly" stocks?

**Research Findings:**

**"Stocks of the Year" Identification:**
**Goldman Sachs created the "Rule of 10" to identify the next wave of stocks poised to soar in value, requiring companies to consistently generate sales growth of 10% and be capable of continuing to do so in the future**. **In early 2025, 21 S&P 500 stocks meet Goldman's revenue criteria**, demonstrating the effectiveness of systematic screening approaches. 