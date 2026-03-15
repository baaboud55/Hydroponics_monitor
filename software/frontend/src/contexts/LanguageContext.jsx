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

        // Bento Marketing
        bentoHeroTitle1: "Smart Growing.",
        bentoHeroTitle2: "Zero Effort.",
        bentoHeroSub: "HydroMonitor takes the guesswork out of growing. It constantly watches your water, temperature, and plant food — then automatically adds exactly what your plants need.",
        bentoScrollPrompt: "SCROLL TO EXPLORE ↓",
        
        bentoSensorBadge: "Precision Sensors",
        bentoSensorTitle: "24/7 Quality Checks",
        bentoSensorSub: "Industrial-grade pH and EC probes monitor your reservoir water round the clock.",
        
        bentoPumpBadge: "Autonomous Dosing",
        bentoPumpTitle: "Perfect Nutrients",
        bentoPumpSub: "Micro-dosing pumps automatically adjust pH and plant food levels with surgical precision.",
        
        bentoHubBadge: "Smart Hub",
        bentoHubTitle: "The Brains",
        bentoHubSub: "Wi-Fi enabled control center keeps you connected to your plants from anywhere.",
        
        bentoActionTitle: "Take Control.",
        bentoActionSub: "Experience the easiest way to grow healthy plants at home.",

        // MainMenu (Legacy Cards)
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
        tip3_2: "Make sure your home Wi-Fi reaches the box.",

        // Admin Dash
        adminTitle: "HydroMonitor Admin",
        tabDashboard: "Tech Dashboard",
        tabAutomation: "Automation rules",
        tabConfig: "Parameter config",
        backToVisualizer: "Back to Visualizer",
        systemOnlineRaw: "System Online",
        connecting: "Connecting...",
        nutrientSolution: "Nutrient Solution",
        environmentAir: "Environment (Air)",
        systemHealth: "System Health",
        waterTempLabel: "Water Temp",
        resLevel: "Res. Level",
        airTemp: "Air Temp",
        dissolvedO2: "Dissolved O₂",
        humidity: "Humidity",
        vpd: "VPD",
        pumpCurrent: "Pump Current",
        // Config
        paramConfig: "Parameter Configuration",
        paramConfigDesc: "Set target values and enable automation for autonomous dosing",
        saveConfig: "Save Configuration",
        saving: "Saving...",
        configSaved: "Configuration saved successfully!",
        configFailed: "Failed to save configuration",
        autonomousControlAdmin: "Autonomous Control",
        current: "Current",
        targetRaw: "Target",
        outsideTolerance: "Outside tolerance, dosing active",
        targetValue: "Target Value",
        tolerance: "Tolerance",
        tight: "Tight",
        loose: "Loose",
        howItWorks: "How It Works",
        howItWorks1: "Set your desired target values for pH and EC.",
        howItWorks2: "Adjust tolerance to control how precisely the system maintains values.",
        howItWorks3: "Enable automation to start autonomous dosing.",
        howItWorks4: "The system will automatically dose to keep parameters within target ± tolerance.",
        // Auto Status
        automationStatusTitle: "Automation Status",
        activeParams: "Active Parameters",
        lastDose: "Last Dose",
        none: "None",
        recentHistory: "Recent Dosing History",
        noHistory: "No dosing history yet",
        dose: "Dose",
        safetyNotice: "Automation Active",
        safetyDesc: "The system is automatically dosing to maintain target parameters. Safety limits are enforced.",
        active: "Active",
        inactive: "Inactive",
        errorMargin: "Error",
        
        // Control Panel
        solenoidValves: "Solenoid Valves",
        circulationPumps: "Circulation Pumps",
        mainPump: "Main Pump",
        dosingPumps: "Dosing Pumps",
        dose5s: "Dose 5s",
        pumpA: "Pump A",
        pumpB: "Pump B",
        phUpDown: "pH Up/Down",
        auxPump: "Aux",
        
        // Calibration Wizard
        calWizardTitle: "Calibration Wizard",
        calWizardDesc: "Follow the steps to ensure your sensors take highly accurate measurements.",
        whichSensor: "Which sensor are we calibrating?",
        chooseDiffSensor: "Choose different sensor",
        liveReading: "Live Reading",
        calibration: "Calibration",
        processing: "Processing...",
        calComplete: "Calibration Complete!",
        calNowCalibrated: "is now properly calibrated.",
        doneBtn: "Done",
        clearCalibration: "Clear Calibration",
        clearData: "Clear Data",
        phProbe: "pH Probe",
        resetPh: "Reset existing pH calibration data from memory.",
        midCalibration: "Midpoint Calibration (pH 7.0)",
        rinsePh: "Rinse the probe and place it in a pH 7.0 buffer solution. Wait for the reading to stabilize.",
        calPh7: "Calibrate pH 7.0",
        ecProbe: "EC Probe",
        resetEc: "Reset existing EC calibration data from memory.",
        dissolvedOxygen: "Dissolved Oxygen",
        resetDo: "Clears all DO calibration data.",
        atmCalibration: "Atmospheric Calibration",
        pullProbe: "Pull the probe out of the water, dry it off, and let it sit in the air for 1 minute before proceeding.",
        calInAir: "Calibrate in Air",
        zeroCalibration: "Zero Calibration",
        placeProbeZero: "Place the probe in 0 Dissolved Oxygen calibration solution. Wait for the reading to stabilize near 0.",
        calToZero: "Calibrate to Zero",
        backToHub: "Back to Hub"
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

        // Bento Marketing
        bentoHeroTitle1: "زراعة ذكية.",
        bentoHeroTitle2: "بدون مجهود.",
        bentoHeroSub: "نظام هايدرومونيتور يزيل التخمين من الزراعة. يراقب باستمرار مستويات المياه والحرارة وغذاء النبات — ثم يضيف تلقائياً ما تحتاجه نباتاتك بالضبط لتحى بصحة ممتازة.",
        bentoScrollPrompt: "قم بالتمرير للاكتشاف ↓",
        
        bentoSensorBadge: "مستشعرات دقيقة",
        bentoSensorTitle: "فحوصات مستمرة",
        bentoSensorSub: "مجسات صناعية لحموضة وغذاء المياه تراقب خزانك على مدار الساعة.",
        
        bentoPumpBadge: "ضخ تلقائي",
        bentoPumpTitle: "تغذية مثالية",
        bentoPumpSub: "مضخات دقيقة تعدل مستويات الحموضة وغذاء النبات بدقة جراحية.",
        
        bentoHubBadge: "المركز الذكي",
        bentoHubTitle: "العقل المدبر",
        bentoHubSub: "مركز تحكم متصل بشبكة Wi-Fi يبقيك على اتصال بنباتاتك من أي مكان.",
        
        bentoActionTitle: "تولَّ القيادة.",
        bentoActionSub: "جرب أسهل طريقة لزراعة نباتات صحية في منزلك.",

        // MainMenu (Legacy Cards)
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
        tip3_2: "تأكد من وصول إشارة Wi-Fi المنزلية إلى الصندوق.",

        // Admin Dash
        adminTitle: "لوحة تحكم النظام",
        tabDashboard: "لوحة التحكم التقنية",
        tabAutomation: "قواعد الأتمتة",
        tabConfig: "إعدادات المعايير",
        backToVisualizer: "العودة للمراقب المرئي",
        systemOnlineRaw: "النظام متصل",
        connecting: "جاري الاتصال...",
        nutrientSolution: "محلول المغذيات",
        environmentAir: "البيئة (الهواء)",
        systemHealth: "صحة النظام",
        waterTempLabel: "حرارة الماء",
        resLevel: "مستوى الخزان",
        airTemp: "حرارة الهواء",
        dissolvedO2: "الأكسجين المذاب",
        humidity: "الرطوبة",
        vpd: "VPD (ضغط البخار)",
        pumpCurrent: "تيار المضخة",
        // Config
        paramConfig: "إعدادات المعايير",
        paramConfigDesc: "حدد القيم المطلوبة وقم بتفعيل الأتمتة للضخ الآلي",
        saveConfig: "حفظ الإعدادات",
        saving: "جاري الحفظ...",
        configSaved: "تم حفظ الإعدادات بنجاح!",
        configFailed: "فشل حفظ الإعدادات",
        autonomousControlAdmin: "التحكم الآلي",
        current: "الحالي",
        targetRaw: "الهدف",
        outsideTolerance: "خارج النطاق، الضخ نشط",
        targetValue: "القيمة المستهدفة",
        tolerance: "درجة التفاوت",
        tight: "دقيق",
        loose: "مرن",
        howItWorks: "كيف يعمل النظام",
        howItWorks1: "حدد القيم المطلوبة للحموضة والغذاء.",
        howItWorks2: "اضبط درجة التفاوت للتحكم في دقة النظام.",
        howItWorks3: "قم بتفعيل الأتمتة لبدء الضخ الآلي.",
        howItWorks4: "سيقوم النظام بالضخ الآلي للحفاظ على المعايير ضمن النطاق المطلوب.",
        // Auto Status
        automationStatusTitle: "حالة الأتمتة",
        activeParams: "المعايير النشطة",
        lastDose: "آخر ضخة",
        none: "لا يوجد",
        recentHistory: "سجل الضخ الأخير",
        noHistory: "لا يوجد سجل للضخ بعد",
        dose: "ضخة",
        safetyNotice: "الأتمتة نشطة",
        safetyDesc: "يقوم النظام بالضخ الآلي للحفاظ على المعايير المستهدفة. حدود الأمان مفعلة.",
        active: "نشط",
        inactive: "غير نشط",
        errorMargin: "الفرق",

        // Control Panel
        solenoidValves: "الصمامات الكهرومغناطيسية",
        circulationPumps: "مضخات التدوير",
        mainPump: "المضخة الرئيسية",
        dosingPumps: "مضخات الضخ",
        dose5s: "ضخ لمدة 5 ثواني",
        pumpA: "مضخة A",
        pumpB: "مضخة B",
        phUpDown: "رافع/خافض الحموضة",
        auxPump: "مضخة إضافية",

        // Calibration Wizard
        calWizardTitle: "معالج المعايرة",
        calWizardDesc: "اتبع الخطوات لضمان دقة قياسات مستشعراتك.",
        whichSensor: "أي مستشعر نقوم بمعايرته؟",
        chooseDiffSensor: "اختر مستشعراً آخر",
        liveReading: "القراءة المباشرة",
        calibration: "المعايرة",
        processing: "جاري المعالجة...",
        calComplete: "اكتملت المعايرة!",
        calNowCalibrated: "تمت معايرته الآن بشكل صحيح.",
        doneBtn: "تم",
        clearCalibration: "مسح المعايرة",
        clearData: "مسح البيانات",
        phProbe: "مسبار الحموضة",
        resetPh: "مسح بيانات معايرة الحموضة الحالية من الذاكرة.",
        midCalibration: "المعايرة المتوسطة (pH 7.0)",
        rinsePh: "اغسل المسبار وضعه في محلول معايرة بدرجة حموضة 7.0. انتظر حتى تستقر القراءة.",
        calPh7: "معايرة للحموضة 7.0",
        ecProbe: "مسبار الغذاء (EC)",
        resetEc: "مسح بيانات معايرة الغذاء الحالية من الذاكرة.",
        dissolvedOxygen: "الأكسجين المذاب",
        resetDo: "مسح جميع بيانات معايرة الأكسجين.",
        atmCalibration: "المعايرة الهوائية",
        pullProbe: "اسحب المسبار من الماء وجففه، ثم دعه في الهواء لمدة دقيقة قبل المتابعة.",
        calInAir: "معايرة في الهواء",
        zeroCalibration: "معايرة الصفر",
        placeProbeZero: "ضع المسبار في محلول معايرة بتركيز صفر للأكسجين المذاب. انتظر حتى تستقر القراءة.",
        calToZero: "معايرة للصفر",
        backToHub: "العودة للقائمة الرئيسية"
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
