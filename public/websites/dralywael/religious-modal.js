// Religious Reminder Modal System
class ReligiousModal {
    constructor() {
        this.modal = document.getElementById('religiousModal');
        this.content = document.getElementById('religiousContent');
        this.timer = document.getElementById('religiousTimer');
        this.closeBtn = document.getElementById('closeReligiousModal');
        this.currentMode = 'arabic'; // Default mode
        this.timerInterval = null;
        this.timeLeft = 10;
        this.config = null;
        
        this.initializeEventListeners();
        this.loadConfig();
    }

    async loadConfig() {
        try {
            const response = await fetch('site.config.json');
            this.config = await response.json();
            
            if (this.config.religious_modal && this.config.religious_modal.enabled) {
                this.currentMode = this.config.religious_modal.mode || 'arabic';
                this.timeLeft = this.config.religious_modal.duration || 10;
                
                // Show modal with configured delay
                const minDelay = this.config.religious_modal.delay_min || 10000;
                const maxDelay = this.config.religious_modal.delay_max || 20000;
                const randomDelay = Math.random() * (maxDelay - minDelay) + minDelay;
                
                setTimeout(() => {
                    this.showModal();
                }, randomDelay);
            }
        } catch (error) {
            console.log('Could not load religious modal config, using defaults');
            // Show modal with default settings
            const randomDelay = Math.random() * (20000 - 10000) + 10000;
            setTimeout(() => {
                this.showModal();
            }, randomDelay);
        }
    }

    // Arabic Messages (100 messages)
    arabicMessages = [
        "قال رسول الله ﷺ: «من قال لا إله إلا الله وحده لا شريك له، له الملك وله الحمد وهو على كل شيء قدير، مائة مرة، كانت له عدل عشر رقاب، وكتبت له مائة حسنة، ومحيت عنه مائة سيئة، وكانت له حرزاً من الشيطان يومه ذلك حتى يمسي»",
        "قال رسول الله ﷺ: «سبحان الله والحمد لله ولا إله إلا الله والله أكبر، أحب إلي مما طلعت عليه الشمس»",
        "قال رسول الله ﷺ: «من قال حين يصبح: اللهم بك أصبحت، وبك أمسيت، وبك أحيا، وبك أموت، وإليك المصير، أصبح وديعة الله في أرضه»",
        "قال رسول الله ﷺ: «من قرأ آية الكرسي دبر كل صلاة مكتوبة، لم يمنعه من دخول الجنة إلا أن يموت»",
        "قال رسول الله ﷺ: «من قال: لا إله إلا الله، مائة مرة، كتب الله له مائة حسنة، ومحا عنه مائة سيئة، وكانت له حرزاً من الشيطان يومه ذلك حتى يمسي»",
        "قال رسول الله ﷺ: «من قال: سبحان الله وبحمده، مائة مرة، حطت خطاياه وإن كانت مثل زبد البحر»",
        "قال رسول الله ﷺ: «من قال: لا إله إلا الله وحده لا شريك له، له الملك وله الحمد وهو على كل شيء قدير، عشر مرات، كان كمن أعتق أربعة أنفس من ولد إسماعيل»",
        "قال رسول الله ﷺ: «من قال: سبحان الله العظيم وبحمده، غرست له نخلة في الجنة»",
        "قال رسول الله ﷺ: «من قال: لا إله إلا الله، مائة مرة، كان له عدل عشر رقاب، وكتبت له مائة حسنة، ومحيت عنه مائة سيئة»",
        "قال رسول الله ﷺ: «من قال: سبحان الله والحمد لله ولا إله إلا الله والله أكبر، مائة مرة، كانت له عدل عشر رقاب، وكتبت له مائة حسنة، ومحيت عنه مائة سيئة»",
        "قال رسول الله ﷺ: «من قال: لا إله إلا الله وحده لا شريك له، له الملك وله الحمد وهو على كل شيء قدير، عشر مرات، كان كمن أعتق أربعة أنفس من ولد إسماعيل»",
        "قال رسول الله ﷺ: «من قال: سبحان الله العظيم وبحمده، غرست له نخلة في الجنة»",
        "قال رسول الله ﷺ: «من قال: لا إله إلا الله، مائة مرة، كان له عدل عشر رقاب، وكتبت له مائة حسنة، ومحيت عنه مائة سيئة»",
        "قال رسول الله ﷺ: «من قال: سبحان الله والحمد لله ولا إله إلا الله والله أكبر، مائة مرة، كانت له عدل عشر رقاب، وكتبت له مائة حسنة، ومحيت عنه مائة سيئة»",
        "قال رسول الله ﷺ: «من قال: لا إله إلا الله وحده لا شريك له، له الملك وله الحمد وهو على كل شيء قدير، عشر مرات، كان كمن أعتق أربعة أنفس من ولد إسماعيل»",
        // Continue with more Arabic messages...
        "قال رسول الله ﷺ: «من قال: سبحان الله العظيم وبحمده، غرست له نخلة في الجنة»",
        "قال رسول الله ﷺ: «من قال: لا إله إلا الله، مائة مرة، كان له عدل عشر رقاب، وكتبت له مائة حسنة، ومحيت عنه مائة سيئة»",
        "قال رسول الله ﷺ: «من قال: سبحان الله والحمد لله ولا إله إلا الله والله أكبر، مائة مرة، كانت له عدل عشر رقاب، وكتبت له مائة حسنة، ومحيت عنه مائة سيئة»",
        "قال رسول الله ﷺ: «من قال: لا إله إلا الله وحده لا شريك له، له الملك وله الحمد وهو على كل شيء قدير، عشر مرات، كان كمن أعتق أربعة أنفس من ولد إسماعيل»",
        "قال رسول الله ﷺ: «من قال: سبحان الله العظيم وبحمده، غرست له نخلة في الجنة»"
        // Add 80 more Arabic messages here...
    ];

    // English Muslim Messages (100 messages)
    englishMuslimMessages = [
        "The Prophet ﷺ said: 'Whoever says 'La ilaha illallah wahdahu la shareeka lah, lahul mulku wa lahul hamdu wa huwa 'ala kulli shay'in qadeer' 100 times, it will be equal to freeing 10 slaves, 100 good deeds will be written for him, 100 sins will be erased from him, and it will be a protection from Satan for that day until evening.'",
        "The Prophet ﷺ said: 'Subhan Allah, Alhamdulillah, La ilaha illallah, Allahu Akbar - these words are dearer to me than everything the sun rises upon.'",
        "The Prophet ﷺ said: 'Whoever recites Ayat Al-Kursi after every obligatory prayer, nothing will prevent him from entering Paradise except death.'",
        "The Prophet ﷺ said: 'Whoever says 'Subhan Allah wa bihamdihi' 100 times, his sins will be forgiven even if they are as much as the foam of the sea.'",
        "The Prophet ﷺ said: 'Whoever says 'La ilaha illallah wahdahu la shareeka lah, lahul mulku wa lahul hamdu wa huwa 'ala kulli shay'in qadeer' 10 times, it is equal to freeing 4 slaves from the children of Ishmael.'",
        "The Prophet ﷺ said: 'Whoever says 'Subhan Allah Al-'Adheem wa bihamdihi' a palm tree will be planted for him in Paradise.'",
        "The Prophet ﷺ said: 'The most beloved words to Allah are four: Subhan Allah, Alhamdulillah, La ilaha illallah, Allahu Akbar.'",
        "The Prophet ﷺ said: 'Whoever says 'Subhan Allah' 33 times, 'Alhamdulillah' 33 times, and 'Allahu Akbar' 34 times after every prayer, his sins will be forgiven even if they are as much as the foam of the sea.'",
        "The Prophet ﷺ said: 'Whoever recites Surah Al-Ikhlas 10 times, Allah will build a palace for him in Paradise.'",
        "The Prophet ﷺ said: 'Whoever says 'La ilaha illallah' sincerely, will enter Paradise.'",
        "The Prophet ﷺ said: 'The best remembrance is 'La ilaha illallah' and the best supplication is 'Alhamdulillah'.'",
        "The Prophet ﷺ said: 'Whoever says 'Subhan Allah wa bihamdihi' 100 times in a day, his sins will be forgiven even if they are as much as the foam of the sea.'",
        "The Prophet ﷺ said: 'Whoever recites the last two verses of Surah Al-Baqarah at night, they will suffice him.'",
        "The Prophet ﷺ said: 'Whoever says 'Subhan Allah Al-'Adheem wa bihamdihi' a palm tree will be planted for him in Paradise.'",
        "The Prophet ﷺ said: 'Whoever says 'La ilaha illallah wahdahu la shareeka lah, lahul mulku wa lahul hamdu wa huwa 'ala kulli shay'in qadeer' 10 times, it is equal to freeing 4 slaves from the children of Ishmael.'",
        "The Prophet ﷺ said: 'Whoever says 'Subhan Allah' 33 times, 'Alhamdulillah' 33 times, and 'Allahu Akbar' 34 times after every prayer, his sins will be forgiven even if they are as much as the foam of the sea.'",
        "The Prophet ﷺ said: 'Whoever recites Surah Al-Ikhlas 10 times, Allah will build a palace for him in Paradise.'",
        "The Prophet ﷺ said: 'Whoever says 'La ilaha illallah' sincerely, will enter Paradise.'",
        "The Prophet ﷺ said: 'The best remembrance is 'La ilaha illallah' and the best supplication is 'Alhamdulillah'.'",
        "The Prophet ﷺ said: 'Whoever says 'Subhan Allah wa bihamdihi' 100 times in a day, his sins will be forgiven even if they are as much as the foam of the sea.'"
        // Add 80 more English Muslim messages here...
    ];

    // English Non-Muslim Messages (100 messages)
    englishNonMuslimMessages = [
        "Islam means 'submission to God' and promotes peace, justice, and compassion. The word 'Islam' comes from the same root as 'salaam' (peace).",
        "Muslims believe in one God (Allah) who is merciful, just, and has no partners or equals. This belief in monotheism is the foundation of Islamic faith.",
        "The Quran is the holy book of Islam, revealed to Prophet Muhammad ﷺ over 23 years. It contains guidance for all aspects of life and is preserved in its original Arabic text.",
        "Islam teaches that all humans are equal before God, regardless of race, ethnicity, or social status. The Prophet ﷺ said: 'All people are equal as the teeth of a comb.'",
        "Muslims believe in all the prophets sent by God, including Adam, Noah, Abraham, Moses, Jesus, and Muhammad ﷺ. They all preached the same message of monotheism.",
        "Islam emphasizes the importance of knowledge and education. The first word revealed in the Quran was 'Iqra' (Read), showing the value Islam places on learning.",
        "Muslims pray five times daily to maintain a constant connection with God. Prayer helps develop discipline, humility, and spiritual awareness.",
        "Islam teaches that women have rights to education, work, property ownership, and inheritance. The Prophet ﷺ said: 'The best of you is the one who is best to his wife.'",
        "Charity (Zakat) is one of the five pillars of Islam. Muslims are required to give 2.5% of their wealth to help the poor and needy.",
        "Islam promotes environmental stewardship. The Prophet ﷺ said: 'If the Hour (Day of Judgment) is about to be established and one of you was holding a palm shoot, let him take advantage of even one second before the Hour is established to plant it.'",
        "Muslims believe in the Day of Judgment when all people will be held accountable for their actions. This belief encourages moral behavior and good deeds.",
        "Islam teaches that God is closer to us than our jugular vein and answers the prayers of those who call upon Him sincerely.",
        "The Prophet Muhammad ﷺ was known for his honesty and trustworthiness even before receiving revelation. He was called 'Al-Amin' (the trustworthy).",
        "Islam teaches that diversity in creation is a sign of God's wisdom. The Quran states: 'And among His signs is the creation of the heavens and the earth and the diversity of your languages and your colors.'",
        "Muslims believe that Jesus (Isa) was a great prophet of God, born to the Virgin Mary, and will return before the Day of Judgment.",
        "Islam promotes family values and respect for parents. The Quran commands: 'And your Lord has decreed that you worship none but Him, and that you be dutiful to your parents.'",
        "Muslims believe that God created humans with free will and the ability to choose between right and wrong. This makes us accountable for our actions.",
        "Islam teaches that the purpose of life is to worship God and serve humanity. Success is measured by good character and righteous deeds.",
        "The Prophet ﷺ said: 'The best of people are those who are most beneficial to people.' This shows Islam's emphasis on serving others.",
        "Islam teaches that God is merciful and forgiving. The Prophet ﷺ said: 'God's mercy is greater than His wrath.'"
        // Add 80 more English Non-Muslim messages here...
    ];

    initializeEventListeners() {
        this.closeBtn.addEventListener('click', () => this.hideModal());
        
        // Close modal when clicking outside
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.hideModal();
            }
        });
    }

    setMode(mode) {
        this.currentMode = mode;
    }

    showModal() {
        this.modal.classList.remove('hidden');
        this.timeLeft = 10;
        this.updateTimer();
        this.showRandomMessage();
        this.startTimer();
    }

    hideModal() {
        this.modal.classList.add('hidden');
        this.stopTimer();
    }

    showRandomMessage() {
        let messages;
        let isArabic = false;

        switch (this.currentMode) {
            case 'arabic':
                messages = this.arabicMessages;
                isArabic = true;
                break;
            case 'english_muslim':
                messages = this.englishMuslimMessages;
                break;
            case 'english_non_muslim':
                messages = this.englishNonMuslimMessages;
                break;
            default:
                messages = this.arabicMessages;
                isArabic = true;
        }

        const randomMessage = messages[Math.floor(Math.random() * messages.length)];
        
        if (isArabic) {
            this.content.innerHTML = `
                <div class="text-right" dir="rtl">
                    <div class="text-lg font-bold text-green-600 mb-4">تذكير إسلامي</div>
                    <div class="text-gray-700 leading-relaxed">${randomMessage}</div>
                </div>
            `;
        } else {
            this.content.innerHTML = `
                <div class="text-left">
                    <div class="text-lg font-bold text-green-600 mb-4">Islamic Reminder</div>
                    <div class="text-gray-700 leading-relaxed">${randomMessage}</div>
                </div>
            `;
        }
    }

    startTimer() {
        this.timerInterval = setInterval(() => {
            this.timeLeft--;
            this.updateTimer();
            
            if (this.timeLeft <= 0) {
                this.hideModal();
            }
        }, 1000);
    }

    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }

    updateTimer() {
        this.timer.textContent = this.timeLeft;
    }
}

// Initialize the modal system
let religiousModal;

document.addEventListener('DOMContentLoaded', () => {
    religiousModal = new ReligiousModal();
});

// Export for use in other scripts
window.ReligiousModal = ReligiousModal;
window.religiousModal = religiousModal; 