import React, { createContext, useContext, useState, useEffect } from 'react';

// Very basic English/Arabic dictionary for the marketing frontend
const translations = {
    en: {
        // Menu
        liveDemo: "Live Demo →",
        smartGrowing: "Smart Home Plant Care",
        autonomousControl: "Automatic Plant Care",
        smartGrowingTitle1: "Smart Growing.",
        smartGrowingTitle2: "Zero Effort.",
        heroSub: "HydroMonitor takes the guesswork out of growing. It constantly watches your water, temperature, and plant food — then automatically adds exactly what your plants need to stay perfectly healthy.",
        launchApp: "⚡ Launch the App",
        viewGithub: "View on GitHub ↗",

        // MainMenu
        welcomeTitle: "Grow plants easily,",
        welcomeTitleAccent: "automatically.",
        welcomeSub: "The smart system that constantly cares for your plants, balancing water, temperature, and food so you don't have to.",
        card1Badge: "System Dashboard",
        card1Title: "Check Your Plants",
        card1Sub: "See live updates and explore how the auto-pilot system manages your growing environment.",
        card1Btn: "Open Dashboard",
        card2Badge: "Hardware Guide",
        card2Title: "Setup Your System",
        card2Sub: "Turn your standard hydroponic setup into a fully automated smart home appliance.",
        card2Btn: "View Installation",
        card3Badge: "Premium Plans",
        card3Title: "Cloud Subscriptions",
        card3Sub: "Unlock AI plant advice, remote phone alerts, and long-term history tracking.",
        card3Btn: "Coming Soon",

        // PlantSelector
        intelligentGrow: "HydroMonitor Smart Grow",
        whatGrowing: "What are we growing today?",
        selectorSub: "Choose what you want to grow, and our smart system will automatically feed, water, and care for your plants.",
        temp: "Temp",
        waterPh: "Water pH",
        plantFood: "Plant Food",
        startGrowing: "Start Growing →",
        lettuceDesc: "Fast-growing leafy greens. Very easy to grow for beginners.",
        tomatoDesc: "Delicious fruit that needs a bit more food and support to grow tall.",
        basilDesc: "Strong-smelling herb that loves warm, bright spaces.",
        strawberryDesc: "Sweet berries that need balanced water and food.",
        lettuce: "Lettuce",
        tomato: "Tomatoes",
        basil: "Basil",
        strawberry: "Strawberries",

        // SystemVisualizer
        changeCrop: "Change Crop",
        systemOnline: "System Online & Active",
        growing: "Growing",
        autopilotMsg: "Auto-pilot is running. Your plants are being taken care of.",
        currentStatus: "Current Status",
        phLevel: "pH Level",
        target: "Target:",
        ph: "pH",
        autoDosingEngaged: "Auto-dosing engaged...",
        plantFoodNutrients: "Plant Food (Nutrients)",
        mscm: "mS/cm",
        mixingNutrient: "Mixing nutrient solution...",
        waterTemp: "Water Temperature",
        c: "°C",
        smartSystemMsg: "The smart system is constantly watching your plants and adding exactly what they need to thrive.",

        // HardwareGuide
        backToMenu: "Back to Menu",
        installationGuide: "Installation Guide",
        step: "Step",
        of: "of",
        nextStep: "Next Step",
        completeSetup: "Complete Setup",

        // Guide Steps
        step1Title: "Place the Sensors",
        step1Desc: "Drop the pH and Plant Food (EC) sensors into your water tank. These act as the eyes and ears of the system.",
        step2Title: "Connect the Pumps",
        step2Desc: "Connect the small tubes from the auto-feeding pumps to your water tank. These will precisely add drops of pH balancer and plant food.",
        step3Title: "Mount the Smart Hub",
        step3Desc: "Mount the main control box on your wall and plug it in. It securely connects to your Wi-Fi and handles all the thinking.",
        tip1_1: "Always keep the tips underwater.",
        tip1_2: "Follow the calibration steps before using them for the first time.",
        tip2_1: "Use the little check valves so water doesn't flow backward.",
        tip2_2: "Make sure all the tubes are pushed on tightly.",
        tip3_1: "The green ring means it is connected and ready.",
        tip3_2: "Make sure your home Wi-Fi reaches the box."
    },
    ar: {
        // Menu
        liveDemo: "عرض تجريبي ←",
        smartGrowing: "العناية الذكية بالنباتات",
        autonomousControl: "رعاية آلية للنباتات",
        smartGrowingTitle1: "زراعة ذكية.",
        smartGrowingTitle2: "بدون أي مجهود.",
        heroSub: "نظام HydroMonitor يزيل التخمين من الزراعة. يراقب باستمرار مستويات الماء والحرارة وغذاء النبات، ثم يضيف تلقائياً ما تحتاجه نباتاتك لتبقى في أفضل صحة.",
        launchApp: "⚡ بدء التطبيق",
        viewGithub: "عرض على GitHub ↖",

        // MainMenu
        welcomeTitle: "ازرع نباتاتك بسهولة،",
        welcomeTitleAccent: "وتلقائياً.",
        welcomeSub: "النظام الذكي الذي يرعى نباتاتك باستمرار، ويوازن مستويات الماء والحرارة والغذاء لتستريح بالكامل.",
        card1Badge: "لوحة تحكم النظام",
        card1Title: "تفقّد نباتاتك",
        card1Sub: "شاهد التحديثات الحية واستكشف كيف يدير نظام الطيار الآلي بيئة الزراعة الخاصة بك.",
        card1Btn: "فتح لوحة التحكم",
        card2Badge: "دليل الأجهزة",
        card2Title: "إعداد نظامك",
        card2Sub: "حوّل نظام الزراعة المائية العادي إلى جهاز منزلي ذكي مؤتمت بالكامل.",
        card2Btn: "عرض خطوات التركيب",
        card3Badge: "الباقات المميزة",
        card3Title: "الاشتراكات السحابية",
        card3Sub: "افتح نصائح النباتات بالذكاء الاصطناعي، التنبيهات عن بُعد، وتتبع السجل طويل الأجل.",
        card3Btn: "قريباً",

        // PlantSelector
        intelligentGrow: "نظام HydroMonitor الذكي",
        whatGrowing: "ماذا سنزرع اليوم؟",
        selectorSub: "اختر ما ترغب في زراعته، وسيقوم نظامنا الذكي تلقائياً بتغذية ورعاية نباتاتك.",
        temp: "الحرارة",
        waterPh: "حموضة الماء",
        plantFood: "غذاء النبات",
        startGrowing: "ابدأ الزراعة ←",
        lettuceDesc: "خضار ورقية سريعة النمو. سهلة جداً للمبتدئين.",
        tomatoDesc: "فاكهة لذيذة تحتاج لقليل من الدعم الإضافي للغذاء لتنمو بشكل أطول.",
        basilDesc: "عشب عطري قوي يحب الأماكن الدافئة والمشرقة.",
        strawberryDesc: "توت حلو يحتاج لتوازن جيد بين الماء والغذاء.",
        lettuce: "الخس",
        tomato: "الطماطم",
        basil: "الريحان",
        strawberry: "الفراولة",

        // SystemVisualizer
        changeCrop: "تغيير المحصول",
        systemOnline: "النظام متصل ونشط",
        growing: "زراعة",
        autopilotMsg: "الطيار الآلي قيد التشغيل. يتم الاعتناء بنباتاتك الآن.",
        currentStatus: "الحالة الحالية",
        phLevel: "مستوى الحموضة",
        target: "الهدف:",
        ph: "pH",
        autoDosingEngaged: "جاري الضخ الآلي...",
        plantFoodNutrients: "غذاء النبات (المغذيات)",
        mscm: "mS/cm",
        mixingNutrient: "يتم خلط محلول المغذيات...",
        waterTemp: "حرارة الماء",
        c: "°C",
        smartSystemMsg: "النظام الذكي يراقب نباتاتك باستمرار ويضيف بالضبط ما تحتاجه لتزدهر.",

        // HardwareGuide
        backToMenu: "العودة للقائمة",
        installationGuide: "دليل التركيب",
        step: "خطوة",
        of: "من",
        nextStep: "الخطوة التالية",
        completeSetup: "إتمام الإعداد",

        // Guide Steps
        step1Title: "ضع المستشعرات",
        step1Desc: "أسقط مستشعرات الحموضة ومقدار الغذاء (EC) في خزان الماء. هذان هما العينان والأذنان للنظام.",
        step2Title: "توصيل المضخات",
        step2Desc: "قم بتوصيل الأنابيب الصغيرة من مضخات التغذية الآلية بخزان الماء. سيقومون بإضافة قطرات من الموازن والمغذيات بدقة.",
        step3Title: "تثبيت المركز الذكي",
        step3Desc: "ثبّت صندوق التحكم الرئيسي على الحائط وقم بتوصيله بالكهرباء. يتصل بشبكة Wi-Fi الخاصة بك ويدير كل عمليات التفكير.",
        tip1_1: "احرص دائماً على إبقاء رؤوس المستشعرات تحت الماء.",
        tip1_2: "اتبع خطوات المعايرة قبل استخدامها لأول مرة.",
        tip2_1: "استخدم الصمامات الصغيرة المانعة للرجوع حتى لا يتدفق الماء للخلف.",
        tip2_2: "تأكد من دفع جميع الأنابيب بإحكام للتثبيت.",
        tip3_1: "الحلقة الخضراء تعني أن الجهاز متصل وجاهز.",
        tip3_2: "تأكد من وصول إشارة Wi-Fi المنزلية إلى الصندوق."
    }
};

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
    // Check local storage or use 'en'
    const [lang, setLang] = useState(() => {
        return localStorage.getItem('appLang') || 'en';
    });

    // Apply RTL direction to the HTML document when Arabic is selected
    useEffect(() => {
        localStorage.setItem('appLang', lang);
        if (lang === 'ar') {
            document.documentElement.dir = 'rtl';
            document.documentElement.lang = 'ar';
        } else {
            document.documentElement.dir = 'ltr';
            document.documentElement.lang = 'en';
        }
    }, [lang]);

    const toggleLanguage = () => {
        setLang((prev) => (prev === 'en' ? 'ar' : 'en'));
    };

    // Translation function
    const t = (key) => {
        return translations[lang][key] || key;
    };

    return (
        <LanguageContext.Provider value={{ lang, toggleLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    return useContext(LanguageContext);
}
