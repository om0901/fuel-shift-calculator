# Product Requirements Document (PRD)

## 1. Executive Summary & Problem Statement
- **App Name:** Fuel Shift Cash & Meter Calculator
- **Problem Statement:** पेट्रोल पंप पर हर शिफ्ट के अंत में नोज़ल मीटर की रीडिंग और इकट्ठे हुए कैश/यूपीआई का हिसाब मैन्युअल रूप से करना पड़ता है, जिससे कैलकुलेशन की गलतियाँ और शॉर्टेज/एक्सेस का सही मिलान नहीं हो पाता।
- **Primary Goal:** एक सीधा, सिंगल-स्क्रीन कैलकुलेटर और लॉगिंग टूल जो मीटर सेल्स और कैश कलेक्शन के अंतर को रीयल-टाइम में कैलकुलेट करे और शिफ्ट रिकॉर्ड्स को स्टोर करे।

## 2. Target Users & Operating Environment
- **Target User:** पेट्रोल पंप मैनेजर्स, कैशियर्स और पंप ऑपरेटर्स।
- **Target Environment:** 
  - वेब पोर्टल (लोकल ब्राउज़र एक्सेस)
  - विंडोज़ डेस्कटॉप सॉफ्टवेयर (.exe स्टैंडअलोन)
- **Input Methods:** कीबोर्ड (नंपैड ऑप्टिमाइज़्ड) और माउस।

## 3. Core Functional Requirements (MVP Scope)

### 3.1. Meter Sales Engine (इनपुट और फॉर्मूला)
- **इनपुट फील्ड्स:**
  - `Opening Reading` (नंबर, डेसिमल सपोर्ट)
  - `Closing Reading` (नंबर, डेसिमल सपोर्ट)
  - `Fuel Price` (रुपये प्रति लीटर)
- **फॉर्मूला:**
  - $\text{Total Liters} = \text{Closing Reading} - \text{Opening Reading}$
  - $\text{Expected Sale Amount (₹)} = \text{Total Liters} \times \text{Fuel Price}$

### 3.2. Cash & Collection Engine (इनपुट और फॉर्मूला)
- **इनपुट फील्ड्स:**
  - `Cash Amount` (कैश कलेक्शन ₹)
  - `UPI / Digital Amount` (ऑनलाइन पेमेंट ₹)
  - `Credit Amount` (उधार / पर्ची ₹)
- **फॉर्मूला:**
  - $\text{Total Collection Amount (₹)} = \text{Cash} + \text{UPI} + \text{Credit}$

### 3.3. Tally & Variance Engine (मिलान स्थिति)
- **फॉर्मूला:**
  - $\text{Difference (₹)} = \text{Total Collection Amount} - \text{Expected Sale Amount}$
- **स्टेटस रूल्स:**
  - यदि $\text{Difference} = 0$: स्टेटस = **"Perfect Tally"** (हरा बैज)
  - यदि $\text{Difference} < 0$: स्टेटस = **"Shortage"** (लाल अलर्ट, जितना पैसा कम है)
  - यदि $\text{Difference} > 0$: स्टेटस = **"Excess"** (नीला अलर्ट, जितना पैसा अतिरिक्त है)

### 3.4. Shift Persistence & History Table
- "Save Shift Record" बटन दबाने पर:
  - तारीख, समय, कुल लीटर, अपेक्षित बिक्री, कुल कलेक्शन, और डिफरेंस लोकल डेटाबेस में सेव हो।
- नीचे एक हिस्ट्री टेबल में पिछले 10 शिफ्ट्स का रिकॉर्ड दिखे।
- रिकॉर्ड को डिलीट करने का ऑप्शन हो।

## 4. User Journey & Screen Flow
1. **App Open:** यूज़र डैशबोर्ड पर आता है जहाँ दो मुख्य कार्ड दिखते हैं: (1) Meter Sales, (2) Cash Collection.
2. **Data Entry:** यूज़र ओपनिंग, क्लोजिंग और फ्यूल प्राइस भरता है $\rightarrow$ Total Liters और Expected Sale तुरंत लाइव अपडेट होते हैं।
3. **Cash Entry:** यूज़र कैश, यूपीआई और क्रेडिट अमाउंट डालता है $\rightarrow$ Total Collection और Difference कार्ड बिना पेज रीलोड किए तुरंत अपडेट होता है।
4. **Save Record:** यूज़र "Save Shift" पर क्लिक करता है $\rightarrow$ फॉर्म रीसेट हो जाता है और हिस्ट्री टेबल में नया रिकॉर्ड जुड़ जाता है।

## 5. Non-Functional Requirements & Guardrails
- **Instant Calculation:** कोई भी "Calculate" बटन दबाने की ज़रूरत नहीं होनी चाहिए, इनपुट टाइप करते ही परिणाम तुरंत दिखे।
- **Validation Rules:**
  - `Closing Reading` कभी भी `Opening Reading` से छोटी नहीं हो सकती। यदि छोटी हो तो इनपुट के नीचे लाल टेक्स्ट में चेतावनी दिखे: *"क्लोजिंग रीडिंग ओपनिंग से कम नहीं हो सकती"*.
  - नेगेटिव इनपुट्स की अनुमति न हो।
- **Offline Reliability:** इंटरनेट बंद होने पर भी डेटाबेस और कैलकुलेशन 100% काम करे।

## 6. Out of Scope (इस वर्जन में क्या नहीं होगा)
- मल्टी-पंप क्लाउड सिंकिंग।
- थर्मल प्रिंटर ड्राइवर इंटीग्रेशन।
- एसएमएस या व्हाट्सएप ऑटोमेशन।