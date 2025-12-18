const fs = require('fs');

const enPath = '/Users/choihajin/Desktop/변방계 정착민 테스트/data/questions_en.json';
const koPath = '/Users/choihajin/Desktop/변방계 정착민 테스트/data/questions_ko.json';

const enData = JSON.parse(fs.readFileSync(enPath, 'utf8'));
const koData = JSON.parse(fs.readFileSync(koPath, 'utf8'));

const translations = {
    1: {
        text: "What's your most intense thought when you open your eyes in the morning?",
        answers: [
            "Ugh... I don't want to wake up. It's going to be another hard day. Nothing goes my way.",
            "I'm awake, so I should do something. A normal day begins.",
            "It's a beautiful morning! What a blessed day! My energy is already over the limit.",
            "I want to start a fire... need something to heat up this quiet morning."
        ]
    },
    2: {
        text: "A colleague said harsh things, calling your work a mess. How do you react?",
        answers: [
            "Immediately throw a punch or scream back to insult them.",
            "Feel bad, but check again if there were really problems with my work.",
            "My heart hurts so much. Go to a corner and sob quietly where no one can see.",
            "Laugh it off, then plan a secret revenge at night."
        ]
    },
    3: {
        text: "Raid! What's your instinctive action when enemies attack the base?",
        answers: [
            "Rush to the front line and slaughter the characters. I love the smell of blood!",
            "Stay in my position and calmly prepare to shoot behind cover.",
            "Too scared, so step back or run away in the opposite direction.",
            "Analyze the situation and target the one with the most valuable equipment."
        ]
    },
    4: {
        text: "Your colleague is on the verge of death. Everyone is hesitating, what would you do?",
        answers: [
            "Use high-quality medicine to save them at any cost.",
            "If their survival is unlikely, focus on others who can be saved.",
            "Too terrified to even approach the bleeding wound.",
            "If they're going to die anyway, I'd rather take their organs for others."
        ]
    },
    5: {
        text: "Found a 'Mystery Box' that fell from a cargo pod. What's your choice?",
        answers: [
            "Open it right away! It might be a treasure or a legendary weapon.",
            "Wait, it could be a trap or high-tech bomb. Scan it first.",
            "It's scary, so leave it far away from the base or bury it.",
            "Calculating the silver value I'd get from selling this box unopened."
        ]
    },
    6: {
        text: "An unknown wanderer is knocking on the base door, asking for help.",
        answers: [
            "Welcome them warmly! They're a new colleague and family.",
            "Test their skills first. If they're not useful, kick them out or use for labor.",
            "Suspicious that they might be a spy. Be on guard and don't open the door easily.",
            "Take everything they have and sell them to a slave trader."
        ]
    },
    7: {
        text: "You were instructed to learn a new work that is unfamiliar and difficult.",
        answers: [
            "So exciting! I want to learn quickly and master it perfectly.",
            "I'll do it because it's an instruction. It won't be easy to learn.",
            "Annoying... I just want to live roughly doing what I've been doing.",
            "If I like the face of the guy teaching me, I'll learn. Otherwise, I'll just swear at him."
        ]
    },
    8: {
        text: "You were assigned the mission of disposing of bloody corpses. How do you feel?",
        answers: [
            "Extremely excited! The dead are just leather.",
            "Do the assigned work without much thought. Endure if it's necessary.",
            "Too disgusting and terrible to even open my eyes. I think I'll have trauma.",
            "I want to display even the corpses beautifully. Dream of an artistic funeral."
        ]
    },
    9: {
        text: "A colleague is having a very hard time and opens up to you. Your reaction?",
        answers: [
            "Sad as if it's my own matter, and sincerely comfort and help.",
            "Listen quietly and seek a rational solution.",
            "I don't know why that's a concern. Secretly feel bored and pass it roughly.",
            "Let's forget worries! Let's go eat something delicious and dance together."
        ]
    },
    10: {
        text: "What is the supreme value you pursue on this harsh Rimworld planet?",
        answers: [
            "Conquest and destruction, tight efficiency and productivity.",
            "A warm community surviving together with colleagues.",
            "A comfortable life, or everything is just vain pain.",
            "Becoming a transcendent being by merging with machines."
        ]
    },
    11: {
        text: "The temperature has exceeded 40 degrees due to a midsummer heatwave. The cooler is also broken.",
        answers: [
            "Finally, my season! Enjoy the heat and throw off your clothes.",
            "It's hot, but bearable. A glass of cold water is enough.",
            "Too hot, so I get annoyed or lie down with no energy.",
            "Heat is energy! Check machines or find work to do."
        ]
    },
    12: {
        text: "You lost an arm in battle. The doctor asks to choose a replacement.",
        answers: [
            "Perfect evolution! I want to replace it with a mechanical arm right now.",
            "As long as I can work, I don't care if it's mechanical or bionic.",
            "Machines are terrible. I'd rather use a bionic arm or live without an arm.",
            "No arm means no need to fight... rather convenient."
        ]
    },
    13: {
        text: "You've been eating only 'nutrient paste' for a few days because food ran out.",
        answers: [
            "Fills the stomach, that's enough. It saves cooking time and is efficient.",
            "Swallow to survive, but want to eat something delicious quickly.",
            "How can I eat this! I'd rather starve or steal food.",
            "I think it'll taste better if I mix in some 'human meat' here."
        ]
    },
    14: {
        text: "You found 'Luciferium' in a corner of the warehouse. Stronger, but die if you stop.",
        answers: [
            "Take it with curiosity to gain superhuman strength.",
            "Only consider it as a last resort in emergencies.",
            "Drugs are the devil's temptation! Firmly refuse and dispose of them.",
            "I don't want to eat it, but I want to force-feed it to an enemy and experiment."
        ]
    },
    15: {
        text: "You were instructed to stay in a small room and just do research for a few days.",
        answers: [
            "Best work environment! Comfortable compared to noisy outside.",
            "A bit stuffy, but I'll endure and perform silently.",
            "This is a prison! I want to go out right now and enjoy freedom.",
            "It's fun to disassemble and assemble the equipment here."
        ]
    },
    15: {
        text: "You were instructed to stay in a small room and just do research for a few days.",
        answers: [
            "Best work environment! Comfortable compared to noisy outside.",
            "A bit stuffy, but I'll endure and perform silently.",
            "This is a prison! I want to go out right now and enjoy freedom.",
            "It's fun to disassemble and assemble the equipment here."
        ]
    },
    16: {
        text: "You're holding only a wooden club, and a giant insect is approaching from afar.",
        answers: [
            "It's a chance! I'll show it the taste of my club. Charge.",
            "Observe its behavior and secretly avoid the place.",
            "Too scared that my legs give out or I just run away.",
            "It'd be good to lure this insect well and use it as a defense resource."
        ]
    },
    17: {
        text: "A fire has broken out in the settlement's wooden building! The flames are spreading rapidly.",
        answers: [
            "Feel euphoria from the sight of those red flames swallowing everything.",
            "Dangerous! Jump in with a water bucket or give instructions to colleagues.",
            "Scream and fall into panic or only take my things and run away.",
            "It's already too late. Get artistic inspiration from the burning building."
        ]
    },
    18: {
        text: "You saw a sculpture made by a colleague, and it's really bizarre and the skill is terrible.",
        answers: [
            "An insult to art! I think it'd be better if I made it myself.",
            "The effort is commendable but encourage properly that it seems there's still a long way to go.",
            "Oh my god, it's so beautiful! I'm really moved.",
            "It's much more efficient to melt this stone and make a wall."
        ]
    },
    19: {
        text: "You failed to tame a wild animal and were bitten quite deeply on the hand.",
        answers: [
            "You dare bite me? Hunt it immediately and put it on tonight's dinner table.",
            "It hurts but endure. Approach sincerely again.",
            "Must treat it first. Step back for now and look at the wound and disinfect it.",
            "I'm crying because it hurts. I won't go near it and just look at the wound."
        ]
    },
    20: {
        text: "Someone is trying to sell you information that 'there is a spaceship to escape this planet'.",
        answers: [
            "The opportunity finally came. I'll take the info and leave by any means necessary.",
            "Hope is seen! Start preparing to escape with colleagues immediately.",
            "High possibility of a trap. Thoroughly investigate the source and truth.",
            "It's livable here too, and annoying. It's clearly trying to trick me."
        ]
    },
    21: {
        text: "You were assigned to cook for everyone using only 'insect meat'.",
        answers: [
            "It's okay as long as it's nutrients. I'll mask the taste with spices.",
            "I'd rather die of hunger than cook this gross stuff!",
            "It doesn't matter what it is as long as I can satisfy my hunger.",
            "I'll cook it perfectly to see how much others hate the taste."
        ]
    },
    22: {
        text: "A colleague passed out due to overwork. How do you feel?",
        answers: [
            "Poor thing! I'll carry them to the medical bed and take over their work.",
            "They should have managed their stamina better. Very inefficient.",
            "I'm scared of collapsing like that too. I should rest more.",
            "Gives me a chance to peek into their personal storage while they're out."
        ]
    },
    23: {
        text: "Dangerous 'toxic fallout' is occurring outside. Everyone must stay indoors.",
        answers: [
            "The green sky is strangely beautiful. I'll observe it from the window.",
            "Boring! I'm going out even if I get sick, I can't stand being indoors.",
            "Safe indoors is the best. I'll focus on indoor work or research.",
            "Worrying about the withering crops and dying animals outside."
        ]
    },
    24: {
        text: "A mystery merchant suggests a 'human organ' in exchange for high-tech parts.",
        answers: [
            "Deal! High-tech parts are essential for our survival and progress.",
            "Unethical! I'll kick the merchant out of the base immediately.",
            "Maybe if we use a prisoner's organ... hesitant but considering.",
            "I don't care about ethics. Show me the parts first."
        ]
    },
    25: {
        text: "You were instructed to carve a massive sculpture for the colony's honor.",
        answers: [
            "My masterpiece will be remembered forever on this planet!",
            "Just a job. I'll finish it quickly as instructed.",
            "Waste of time and resources. We should be growing more food.",
            "I'll carve something bizarre that reflects the madness of this place."
        ]
    },
    26: {
        text: "A huge 'Silver' meteorite fell right next to the base.",
        answers: [
            "We're rich! I'll mine it all and fill the warehouse immediately.",
            "Lucky! Now we can trade for the things we really need.",
            "Annoying, it crushed some of our power lines! Repair first.",
            "I'll use some of the silver to decorate my own room secretly."
        ]
    },
    27: {
        text: "A solar flare occurred, and all electrical devices have stopped.",
        answers: [
            "Relaxing. Finally some quiet time without the hum of machines.",
            "Disaster! Our food will spoil and our defenses are down. Panic.",
            "Maintain the base with traditional methods until power returns.",
            "The darkness is perfect for some secret activities."
        ]
    },
    28: {
        text: "A cargo pod full of 'beer' fell from the sky.",
        answers: [
            "Party time! I'll drink until I pass out with colleagues.",
            "Store it safely for trade or as a reward for hard work.",
            "Alcohol is a poison that lowers productivity. I'll destroy it.",
            "I'll hide some for myself before others notice."
        ]
    },
    29: {
        text: "A manhunter pack of small animals is attacking the base.",
        answers: [
            "Grab your weapons! It's a meat party for tonight.",
            "Too dangerous to go out. Close all doors and wait for them to leave.",
            "Scary! I'll hide under the bed until the noise stops.",
            "I'll set a fire trap to roast them all at once."
        ]
    },
    30: {
        text: "You found an 'Ancient Shrine' while mining. What's your move?",
        answers: [
            "Open it immediately! There might be high-tech gear or ancient secrets.",
            "Dangerous! There could be mechanoids or ancient horrors inside. Be careful.",
            "Leave it alone for now. We have enough problems already.",
            "Examine its structure first to see if we can use it as a safe room."
        ]
    },
    31: {
        text: "One of your colleagues is having a mental break and started wandering aimlessly.",
        answers: [
            "Soothe them with a warm meal and kind words to bring them back.",
            "Arrest them for the colony's safety and lock them in a room.",
            "Ignore them. Everyone goes through that on this planet.",
            "Shout at them to get back to work or I'll slap them."
        ]
    },
    32: {
        text: "A 'Psychic Soothe' is making everyone feel better.",
        answers: [
            "Enjoy this rare moment of peace and work more happily.",
            "It's a fake feeling. I don't trust this artificial happiness.",
            "I'll take this chance to confess my feelings to someone.",
            "The voices are still there... I'm just hiding them."
        ]
    },
    33: {
        text: "A trade caravan from a friendly faction arrived.",
        answers: [
            "Show them the best hospitality and trade for rare resources.",
            "Eye their equipment and think about how to rob them secretly.",
            "Annoying visitors. Handle the trade quickly and let them leave.",
            "I'll try to persuade one of them to join our colony."
        ]
    },
    34: {
        text: "A volcanic winter started, and the sky is covered with ash.",
        answers: [
            "The sky looks artistic in this dark, gloomy way.",
            "Worry about the temperature drop and lack of light for crops.",
            "Stockpile fuel and food to endure the long, cold winter.",
            "I'll start a huge fire to bring some light back to this base."
        ]
    },
    35: {
        text: "A cargo pod full of 'human leather' fell from the sky.",
        answers: [
            "Gross! Burn it or bury it far away immediately.",
            "Useful material. I'll make some high-quality hats and sell them.",
            "I wonder who these people were... feeling weirdly curious.",
            "I'll use it to make a special furniture for someone I hate."
        ]
    },
    36: {
        text: "An 'Infestation' occurred in the middle of the base! Giant insects are everywhere.",
        answers: [
            "Grab the flamethrower! We must burn them out before they spread.",
            "Everyone, evacuate! We'll fight them from a distance with guns.",
            "Hide in the room and lock the door. Terrified of the insects.",
            "Charge with my club! I'll show these bugs who's the boss here."
        ]
    },
    37: {
        text: "A colleague is celebrating their birthday. How do you participate?",
        answers: [
            "Prepare a special gift and host a party for everyone.",
            "Give a simple greeting and go back to work. Productivity first.",
            "Ignore it. Birthdays are meaningless in this harsh world.",
            "I'll drink all the beer at the party before anyone else."
        ]
    },
    38: {
        text: "A 'Psychic Drone' is causing male colleagues to feel depressed.",
        answers: [
            "Support and comfort affected colleagues to keep morale up.",
            "Annoying noise in my head. I'll take drugs to drown it out.",
            "It's just a test of our will. Stand strong and focus on work.",
            "The voices are telling me to do things... dangerous things."
        ]
    },
    39: {
        text: "A wild 'Thrumbo' is sleeping near the base.",
        answers: [
            "Try to tame the legendary beast. It would be a great asset.",
            "Hunt it for its precious horn and fur. High-profit target.",
            "Let it sleep. It's too dangerous to provoke a Thrumbo.",
            "I just want to watch it from afar... it's so majestic."
        ]
    },
    40: {
        text: "The food storage is almost empty. Starvation is coming.",
        answers: [
            "Go out and hunt anything moving, even if it's dangerous.",
            "Ration the food and minimize movement to save energy.",
            "Think about who would be the most 'useful' to keep alive.",
            "Panic and steal the last piece of food for myself."
        ]
    },
    40: {
        text: "The food storage is almost empty. Starvation is coming.",
        answers: [
            "Go out and hunt anything moving, even if it's dangerous.",
            "Ration the food and minimize movement to save energy.",
            "Think about who would be the most 'useful' to keep alive.",
            "Panic and steal the last piece of food for myself."
        ]
    },
    41: {
        text: "A 'Psychic Ship' landed near the base and is emitting an ominous hum.",
        answers: [
            "Gather all fighters and destroy it immediately before it drives us mad.",
            "The hum is strangely soothing. I want to listen to it more.",
            "Terrified! I'll hide in the deepest cave and cover my ears.",
            "Examine its technology from a distance. It's a marvel of machine engineering."
        ]
    },
    42: {
        text: "You found a 'Vanometric Power Cell' in an ancient ruin.",
        answers: [
            "Infinite energy! This is a miracle for our base's future.",
            "Sell it to a trader for a massive amount of silver.",
            "Keep it for my own room to power my private devices.",
            "I'll study its principles to see if I can replicate this technology."
        ]
    },
    43: {
        text: "A colleague accidentally set fire to the herbal medicine storage.",
        answers: [
            "Rush into the fire to save whatever medicine is left!",
            "Scold the colleague severely for their extreme carelessness.",
            "It's okay, we can always grow more. Safety first.",
            "Watching the medicine burn is strangely beautiful. I'm not moving."
        ]
    },
    44: {
        text: "A 'Cold Snap' occurred, and the temperature dropped significantly.",
        answers: [
            "Bundle up in heavy furs and keep working. The cold won't stop me.",
            "Stay near the heater all day and complain about the weather.",
            "This is a great chance to preserve our meat without electricity.",
            "I'll start a huge bonfire in the middle of the base to keep everyone warm."
        ]
    },
    45: {
        text: "A cargo pod full of 'luxury lavish meals' fell from the sky.",
        answers: [
            "A gift from the gods! Let's have a grand feast tonight.",
            "Save them for a critical moment when morale is very low.",
            "I'll hide one for myself to enjoy quietly in my room.",
            "Analyze the ingredients to see how they're made so professionally."
        ]
    },
    46: {
        text: "A 'Poison Ship' is killing all the plants in a wide area around it.",
        answers: [
            "We must destroy it before it kills all our crops and trees!",
            "The grey, dying landscape is quite poetic and artistic.",
            "Afraid of the mechanoids guarding it. I'm staying far away.",
            "I'll use the dead wood from the dying trees as fuel for a massive fire."
        ]
    },
    47: {
        text: "A colleague is teaching you how to use a 'Bionic Eye'.",
        answers: [
            "Fascinating! I want to understand how it interfaces with the brain.",
            "Scary. I don't want to think about having my eye replaced with a machine.",
            "If it helps me shoot better, I'll take it right now.",
            "I'll try to disassemble it to see the tiny sensors inside."
        ]
    },
    48: {
        text: "A 'Manhunter Pack' of man-eating ducks is arriving.",
        answers: [
            "Ducks? I'll carry my club and show them who's at the top of the food chain.",
            "Even small animals are dangerous in a pack. Lock all doors immediately.",
            "Hilarious but terrifying. I'll watch from the window and laugh.",
            "I'll use a mortar to blow them all up before they reach the door."
        ]
    },
    49: {
        text: "You found a 'Resurrector Mech Serum' in a mystery box.",
        answers: [
            "A miracle that can bring the dead back to life! Treasure it.",
            "I'll save it for my own death, just in case.",
            "Sell it for a fortune. Silver is more useful for the living.",
            "Study its nano-technology to see how it repairs cells."
        ]
    },
    50: {
        text: "A colleague is asking for your help to build an 'Escape Ship'.",
        answers: [
            "I'll work day and night to build our ticket home!",
            "What if it fails and we die in space? I'm hesitant.",
            "I'd rather stay here and build a better world than leave.",
            "I'll make sure there's a seat for me, no matter what happens to others."
        ]
    },
    51: {
        text: "A 'Psychic Shock Lance' was found near a dead raider.",
        answers: [
            "A powerful weapon for defense. I'll keep it ready for the next raid.",
            "Ominous and creepy. I don't want to touch it.",
            "I'll study its psychic frequency to understand how it works.",
            "I want to test it on a small animal just to see the effect."
        ]
    },
    52: {
        text: "A cargo pod full of 'high-tech components' fell from the sky.",
        answers: [
            "Exactly what we needed! Now we can build advanced machinery.",
            "Extremely valuable. I'll make sure they're stored in a safe place.",
            "I'll hide one to use for my private computer later.",
            "Analyzing the circuitry... it's so incredibly complex and beautiful."
        ]
    },
    53: {
        text: "A 'Bionic Leg' is being offered to you as a gift from the colony.",
        answers: [
            "Grateful! Now I can move faster and work more efficiently.",
            "I don't want to replace my biological leg with metal. Reject it.",
            "If I have a bionic leg, I can outrun any predator! Accept it.",
            "I'll try to find a way to make it look like a real leg with synthetic skin."
        ]
    },
    54: {
        text: "A 'Heat Wave' is causing the temperature to rise to dangerous levels.",
        answers: [
            "It's too hot to work! I'll stay in the freezer and complain.",
            "I'll build more coolers and ensure the power supply is stable.",
            "I'll work at night when it's cooler and sleep during the day.",
            "The heat is making me feel aggressive... I might start a fight."
        ]
    },
    55: {
        text: "A colleague is crying because their pet was killed by a raider.",
        answers: [
            "Comfort them and promise to get a new pet soon.",
            "Death is common on this planet. Tell them to grow up and get back to work.",
            "It's just an animal. I don't understand why they're so upset.",
            "I'll use the pet's hide to make a commemorative item for them."
        ]
    },
    56: {
        text: "A 'Ship Part' with an ominous humming sound fell near the base.",
        answers: [
            "We must destroy it immediately! It's a psychic threat.",
            "The sound is mesmerising. I want to build my room near it.",
            "Hide in the base and wait for the fighters to deal with it.",
            "I'll try to shield its signal with stone walls."
        ]
    },
    57: {
        text: "You found a 'Tornado Generator' in an ancient stash.",
        answers: [
            "A weapon of mass destruction! Use it wisely in the final battle.",
            "Too dangerous to keep. I'll sell it to a passing merchant.",
            "I want to see what a tornado looks like up close! Let's trigger it.",
            "I'll study its atmospheric manipulation technology."
        ]
    },
    58: {
        text: "A 'Psychic Drone' is making female colleagues feel irritable.",
        answers: [
            "Be patient and helpful to those affected by the drone.",
            "Annoying. I'll stay away from women until the drone ends.",
            "I'll take some calming drugs to help me deal with the stress.",
            "The voices are telling me secrets about the colonist's pasts."
        ]
    },
    59: {
        text: "A 'Meteor Shower' is happening in the distance.",
        answers: [
            "Beautiful sight! I'll watch it with a colleague.",
            "Potential for rare resources! I'll mark the impact sites.",
            "Terrifying! What if one hits our base? I'll hide.",
            "The fireballs in the sky are like falling stars of destruction."
        ]
    },
    60: {
        text: "The colony is holding a 'Feast' to celebrate a successful harvest.",
        answers: [
            "Contribute by cooking the best meals and hosting the event.",
            "Eat as much as possible and then go to sleep. Joyful time.",
            "Waste of time and food. We should be preparing for the next raid.",
            "I'll use the opportunity to steal some silver from others' rooms."
        ]
    },
    61: {
        text: "A 'Thrumbo' is self-tamed and joined the colony!",
        answers: [
            "Amazing! A legendary beast as our companion. This is a blessing.",
            "Too much food to maintain. We should slaughter it for its horn and meat.",
            "Worry about the Thrumbo accidentally destroying our crops.",
            "I'll build a special barn for it and decorate it with gold."
        ]
    },
    62: {
        text: "A raider is begging for mercy after being captured.",
        answers: [
            "Forgive them and offer a chance to join as a new colleague.",
            "Execute them as a warning to other raiders. Justice must be served.",
            "Sell them to a slave trader to get some silver for the colony.",
            "Use them as a test subject for our new medical procedures."
        ]
    },
    63: {
        text: "You found a 'Healer Mech Serum' in an ancient temple.",
        answers: [
            "A miraculous medicine! I'll save it for a life-threatening injury.",
            "Sell it for a high price. Silver can buy more medicines.",
            "I'll use it to heal my old scar and look beautiful again.",
            "Study its nano-structures to understand how it heals so perfectly."
        ]
    },
    64: {
        text: "A 'Solar Flare' started and all electronics are dead.",
        answers: [
            "Enjoy the primitive life for a while. It's peaceful.",
            "Panic about our freezer meat spoiling. Save it somehow!",
            "It's a huge disadvantage if we get raided now. On guard.",
            "Darkness is the best time for meditation and reflecting on life."
        ]
    },
    65: {
        text: "A cargo pod full of 'synthread' fell from the sky.",
        answers: [
            "Useful material for durable clothes! I'll start tailoring right now.",
            "Sell it to a trader for a good profit.",
            "I'll use it to make a special outfit for myself to show off.",
            "Analyze its synthetic fibers to see if we can produce it here."
        ]
    },
    66: {
        text: "A colleague is suggesting a 'Prank' on another colonist.",
        answers: [
            "Sounds fun! I'll join in and make it a memorable joke.",
            "Immature and counterproductive. I'll refuse and tell them to work.",
            "I'll use the opportunity to frame someone else for the prank.",
            "I'll make the prank involve some small, controlled fires."
        ]
    },
    67: {
        text: "A 'Psychic Soothe' is making everyone feel calm and happy.",
        answers: [
            "Use this peaceful time to build stronger bonds with colleagues.",
            "It's a fake feeling. I'll stay focused and not get distracted.",
            "I'll write a poem or paint a picture while in this good mood.",
            "I suspicious of whoever is controlling this psychic wave."
        ]
    },
    68: {
        text: "A cargo pod full of 'chemfuel' fell from the sky.",
        answers: [
            "Great! Now our generators will run for a long time.",
            "Extremely dangerous! Store it far away from the main base.",
            "I'll use some to make high-explosive shells for our mortar.",
            "Watching the chemfuel burn with its blue flame is so mesmerising."
        ]
    },
    69: {
        text: "A raider dropped a 'Power Claw' after a battle.",
        answers: [
            "A terrifying but powerful melee weapon! I'll have it installed.",
            "Machines replacing hands... it's disgusting. I'll destroy it.",
            "I'll sell it to a trader for a massive amount of silver.",
            "I'll use it to carve stone more efficiently, maybe?"
        ]
    },
    70: {
        text: "A colleague is proposing to build a 'Great Altar' for our beliefs.",
        answers: [
            "Yes! A place of worship will keep our spirits high and united.",
            "Waste of resources. We need more turrets, not altars.",
            "I'll make sure the altar is decorated with the most expensive gems.",
            "I'll design the altar to have an eternal flame burning on it."
        ]
    },
    70: {
        text: "A colleague is proposing to build a 'Great Altar' for our beliefs.",
        answers: [
            "Yes! A place of worship will keep our spirits high and united.",
            "Waste of resources. We need more turrets, not altars.",
            "I'll make sure the altar is decorated with the most expensive gems.",
            "I'll design the altar to have an eternal flame burning on it."
        ]
    },
    71: {
        text: "A 'Psychic Ship' hum is becoming unbearable. Everyone is stressed.",
        answers: [
            "We must end this now! Direct assault on the ship.",
            "The hum is telling me to do 'art'. I'll start a new sculpture.",
            "I'll take some psychic foil hats and try to ignore it.",
            "I'll study the psychic wave to see if we can weaponize it."
        ]
    },
    72: {
        text: "A cargo pod full of 'gold' fell in the middle of a raider camp.",
        answers: [
            "It's ours! Gather the fighters and raid the raiders for the gold.",
            "Too risky. Let them keep the gold, we value our lives more.",
            "I'll try to sneak in at night and steal as much as I can carry.",
            "If they have gold, we can expect them to have better gear too. Be on guard."
        ]
    },
    73: {
        text: "A colleague developed a 'Drug Addiction'. How do you handle it?",
        answers: [
            "Help them through the withdrawal with care and medical support.",
            "Lock them in a room until they're clean. Tough love is necessary.",
            "Waste of resources correctly. If they can't work, they shouldn't eat.",
            "I'll provide them with more drugs to keep them 'functional'."
        ]
    },
    74: {
        text: "A 'Bionic Heart' is being offered for a critical surgery.",
        answers: [
            "A chance to become more than human! I'll take it gladly.",
            "I'm scared of having my heart replaced by a machine. Reject.",
            "If it improves my stamina and health, I'm in.",
            "I'll study how the machine pumps blood so perfectly."
        ]
    },
    75: {
        text: "A 'Cold Snap' is killing all the crops in the field.",
        answers: [
            "Harvest everything immediately! We can save some of it.",
            "It's frustrating to see our hard work go to waste.",
            "I'll build heaters in the greenhouse to save the most valuable crops.",
            "I'll use the dead plants as fuel for a base-wide heating fire."
        ]
    },
    76: {
        text: "A cargo pod full of 'advanced components' fell in a swamp.",
        answers: [
            "Trudge through the swamp and get those components! We need tech.",
            "The swamp is dangerous and slow. We'll wait until we have better gear.",
            "I'll send someone else to do the dirty work. I'm staying here.",
            "I'll use a transport pod to land right on top of the components."
        ]
    },
    77: {
        text: "A colleague is proposing to build a 'Grand Throne Room'.",
        answers: [
            "Yes! Our leader deserves a place of absolute power and luxury.",
            "Waste of silver and gold. We should be building more traps.",
            "I hope I'm the one who gets to sit on that throne.",
            "I'll design the throne to be made of pure gold and bionic parts."
        ]
    },
    78: {
        text: "A 'Psychic Drone' ended, and everyone is feeling a huge relief.",
        answers: [
            "Celebrate our victory over the psychic noise with a feast!",
            "Finally, I can think clearly again. Back to research.",
            "The silence is actually quite scary after all that noise.",
            "I'll start a small fire to celebrate the return of our sanity."
        ]
    },
    79: {
        text: "A cargo pod full of 'uranium' fell from the sky.",
        answers: [
            "Powerful material for advanced weapons and armor! Store it carefully.",
            "Dangerous and radioactive. I don't want to go anywhere near it.",
            "I'll use it to make a powerful uranium mace for myself.",
            "Analyze its atomic structure to see if we can build a reactor."
        ]
    },
    80: {
        text: "A colleague is asking for your opinion on 'Genetic Modification'.",
        answers: [
            "Improving our genes is the natural next step in our evolution.",
            "It's playing god! We should remain as nature intended.",
            "If it makes me stronger or live longer, I'm all for it.",
            "I want to see if we can give ourselves the ability to see in the dark."
        ]
    },
    81: {
        text: "A 'Poison Ship' crashed right into our main workshop.",
        answers: [
            "Absolute disaster! Clear the wreckage and salvage what we can.",
            "The green toxic glow is oddly beautiful amidst the ruins.",
            "The mechanoids inside are right in our face! Fight for our lives.",
            "I'll use the ship's toxic output to create a defensive barrier."
        ]
    },
    82: {
        text: "A cargo pod full of 'plasteel' fell near the base.",
        answers: [
            "The strongest material! Now we can build the best armor and weapons.",
            "Extremely valuable. I'll make sure it's mined and stored immediately.",
            "I'll use some to reinforce my own room's walls and doors.",
            "Analyze its molecular bonding to see how it's so incredibly strong."
        ]
    },
    83: {
        text: "A colleague is suggesting to host a 'Gladitorial Duel'.",
        answers: [
            "Great way to settle disputes and improve combat skills!",
            "Barbaric and cruel. I won't participate or watch.",
            "I'll be the champion! I want to show off my melee skills.",
            "I'll make sure the arena is surrounded by fire for 'atmosphere'."
        ]
    },
    84: {
        text: "A 'Psychic Soothe' started, and everyone is feeling very peaceful.",
        answers: [
            "I'll take this chance to clear the backlog of administrative work.",
            "It's a good time for some artistic creation. I'll start a painting.",
            "I'll just relax in the garden and enjoy the peaceful vibe.",
            "I'll try to trace the source of this soothe... it's too perfect."
        ]
    },
    85: {
        text: "A cargo pod full of 'high-tech medicine' fell in the forest.",
        answers: [
            "Retrieve it immediately! This could save many lives in the next raid.",
            "The forest is dangerous. We'll send a small, armed group.",
            "I'll keep some of it for my private stash, just in case.",
            "I'll study the chemical composition of these advanced drugs."
        ]
    },
    86: {
        text: "A colleague is proposing to build a 'Memorial' for our fallen friends.",
        answers: [
            "Yes. We must honor those who gave their lives for the colony.",
            "The dead are gone. We should focus on the living and our survival.",
            "I'll make sure the memorial is grand and made of the best marble.",
            "I'll design the memorial to have an eternal flame for each person."
        ]
    },
    87: {
        text: "A 'Heat Wave' is causing the crops to wither and die.",
        answers: [
            "Harvest what's left and prepare for a potential food shortage.",
            "It's so hot, I can't even think about the crops. I'm staying in the shade.",
            "I'll try to build a massive cooling system for the whole field.",
            "The yellow, dried-up field is a perfect place for a huge fire."
        ]
    },
    88: {
        text: "A cargo pod full of 'hyperweave' fell from the sky.",
        answers: [
            "The best fabric for protection! I'll make high-end gear right now.",
            "Sell it to a high-tech trader for a fortune in silver.",
            "I'll make a special, beautiful outfit for myself with this fabric.",
            "Analyze the weave to see if we can replicate this synthetic material."
        ]
    },
    89: {
        text: "A 'Psychic Drone' is making male colleagues feel very aggressive.",
        answers: [
            "Stay away from each other and focus on solitary tasks for a while.",
            "Take some calming drugs or meditate to keep the aggression in check.",
            "I'll channel my aggression into some hard manual labor.",
            "The voices are telling me which colleagues are actually our enemies."
        ]
    },
    90: {
        text: "A 'Meteor' of 'Plasteel' hit the raider's forward base.",
        answers: [
            "A strike from the heavens! Let's raid them while they're in chaos.",
            "Stay away. It might be a trap or there might be something else inside.",
            "I'll try to salvage the plasteel after the raiders abandon the base.",
            "The crater left by the meteor is a perfect shape for an arena."
        ]
    },
    91: {
        text: "A colleague is proposing a 'Scientific Expedition' to a nearby ruin.",
        answers: [
            "Yes! We need to uncover more technology and ancient secrets.",
            "Too dangerous. We should stay and strengthen our own defenses first.",
            "I'll go as long as I get first pick of any loot we find.",
            "I'll lead the expedition to ensure we find the best machine parts."
        ]
    },
    92: {
        text: "A 'Solar Flare' ended, and the hum of machines is back.",
        answers: [
            "Finally! Get the turret's back online and check the food storage.",
            "The silence was nice while it lasted. Back to the noisy grind.",
            "I'll run a full diagnostic on all our electrical systems.",
            "I'll start a fire to celebrate the return of our high-tech life."
        ]
    },
    93: {
        text: "A cargo pod full of 'neutroamine' fell from the sky.",
        answers: [
            "Essential for making advanced medicines! Store it very safely.",
            "Expensive and valuable. I'll trade it for high-tech components.",
            "I'll use some to experiment with making my own custom drugs.",
            "Study its chemical properties to see if we can synthesize it ourselves."
        ]
    },
    94: {
        text: "A colleague is suggesting to build a 'Communication Console'.",
        answers: [
            "Yes! We need to trade and gather info from other settlements.",
            "Waste of energy and resources. We shouldn't talk to outsiders.",
            "I'll use the console to find out if there's any rich settlements nearby.",
            "I'll try to hack into other settlement's databases through the console."
        ]
    },
    95: {
        text: "A 'Psychic Soothe' is making everyone feel very creative.",
        answers: [
            "I'll start building that grand sculpture I've been thinking about.",
            "I'll write a new guide for our colony's future survival.",
            "I'll spend time in the garden, designing a more beautiful layout.",
            "I'll try to create a new type of fire using various chemicals."
        ]
    },
    96: {
        text: "A cargo pod full of 'advanced components' fell in the middle of a forest fire.",
        answers: [
            "Risk the heat and get those components! They are too valuable to lose.",
            "Too dangerous. We'll wait until the fire dies out and see what's left.",
            "I'll use the fire as a distraction to steal something else from the storage.",
            "Watching the components melt in the fire is incredibly fascinating."
        ]
    },
    97: {
        text: "A colleague is proposing to build a 'Hospital' with high-tech beds.",
        answers: [
            "Yes! We need the best medical care to ensure our survival.",
            "Waste of resources correctly. A simple sleeping bag is enough for healing.",
            "I want my own private high-tech hospital bed for personal use.",
            "I'll design the hospital to be sterile and filled with machine assistants."
        ]
    },
    98: {
        text: "A 'Cold Snap' is causing the base's water pipes to freeze.",
        answers: [
            "Grab the tools and start thawing them immediately! We need water.",
            "Complain about the cold and the lack of running water constantly.",
            "I'll build a massive furnace to heat the whole plumbing system.",
            "I'll use some of the frozen water to make a sculpture of ice."
        ]
    },
    99: {
        text: "A 'Psychic Drone' is making everyone feel extremely bored and unmotivated.",
        answers: [
            "Host a small event or share a meal to lift everyone's spirits.",
            "Take some stimulants to stay focused and keep working.",
            "I'll spend time meditiating and finding peace within myself.",
            "I'll start a small, controlled fire to bring some excitement to the base."
        ]
    },
    100: {
        text: "A cargo pod full of 'luciferium' fell near the base door.",
        answers: [
            "Tempting... superhuman strength but for a price. Burn it immediately.",
            "I'll take it and see how far it takes me. Survival at any cost.",
            "I'll sell it to a passing trader for a massive profit.",
            "I'll use it to create 'super-fighters' out of our prisoners."
        ]
    },
    101: {
        text: "Isolated situation... the only food source is a colleague's corpse. Your choice?",
        answers: [
            "Maintain human dignity even if I starve to death, or sacrifice myself for others.",
            "Survival is victory. It's just protein. I'll eat or already expected it.",
            "Losing my mind. Scream and tear the corpse apart, then run away.",
            "Burn the body as a ritual to the sky. Want to see the beauty of the roast smoke."
        ]
    },
    102: {
        text: "Will you receive a bionic eye implant that analyzes the world like an animal?",
        answers: [
            "Perfect opportunity to transcend humanity! Expect the aesthetics of red glow.",
            "My original eye is holy. Reject it or use it only for finding weaknesses.",
            "If my shooting skill improves, I can give up one eye.",
            "Terrifying. Just imagining the eye being gouged out makes my hair stand up."
        ]
    },
    103: {
        text: "There's 'Luciferium' that can cure any illness but you can never stop taking it for life.",
        answers: [
            "Live for tomorrow. Take it and enjoy the cellular reconstruction.",
            "Rather die with dignity than be a slave to addiction, or destroy it.",
            "Beg colleagues for supply for life and try to stay alive by any means.",
            "Out of mind. Deceive a colleague to take it first and watch the progress."
        ]
    },
    104: {
        text: "Toxic fallout has fallen. Long indoor stay required. Looking at the green sky, you?",
        answers: [
            "Maintain base order indoors. Focus on internal work or research.",
            "Being trapped is driving me crazy! Abuse your body or run out forcibly.",
            "Lost in gloomy thoughts on bed, wondering if it's the end of the world.",
            "If my body were electric parts, I would have ignored toxicity and even danced."
        ]
    },
    105: {
        text: "A colleague you're not interested in has sent you a long love letter.",
        answers: [
            "Grateful! Respond positively or already feel tired of my own beauty.",
            "Labor first. Coldly refuse or use the weakness to make them work.",
            "Too shy to look up. Avoid the colleague all day.",
            "My heart is already bionic. Wish to be a being that doesn't feel love."
        ]
    },
    106: {
        text: "The storage is full of insect meat. Everyone hesitates to eat it.",
        answers: [
            "Protein is protein. Eat first to reassure others or mask the smell by cooking.",
            "Rather scream than eat bugs, or deceive others that it's pork.",
            "So hungry that I don't care about bugs. Gorge myself.",
            "Enjoy the subtle sweet smell of burning insect fluids and start a fire."
        ]
    },
    107: {
        text: "Found an ancient grave. It looks full of expensive resources.",
        answers: [
            "Cannot disturb the rest. Offer a prayer or research the historical value.",
            "The dead don't speak. Improve our lives with the resources.",
            "The decorations are tempting. Want to decorate my room despite the curse.",
            "Use the ancient bones as a framework for my bionic experiments."
        ]
    },
    108: {
        text: "The ceiling collapsed during mining and a colleague is trapped. Your instinct?",
        answers: [
            "Doesn't matter if I get hurt! Charge into the rubble and pull them out.",
            "Risk of collapse. Secure safety with pillars or call the rescue team.",
            "They're done for. Take the nearby rare ores and leave.",
            "Sublimating the colleague's pain into art. Record this despair as a song."
        ]
    },
    109: {
        text: "Legendary 'Thrumbos' appeared near the settlement.",
        answers: [
            "Tame the beautiful creature as a guardian or feel quiet awe.",
            "Beast with expensive horn and fur. Hunt it immediately or imagine the taste.",
            "Monster for one-on-hundred. Forbid provocation and ensure safety.",
            "Maybe use its horn as lubricant for my machinery reinforcement."
        ]
    },
    110: {
        text: "A prisoner collapsed. Extracting their kidney can save our dying colleague.",
        answers: [
            "Damaging the body is evil! Curse the leader and scream.",
            "Saving the colleague is priority. Operate quickly or sell everything.",
            "Can't bear to see blood. Just cry next to them feeling sorry.",
            "Fascinated by the act of organ replacement as a step to mechanization."
        ]
    },
    111: {
        text: "A slave trader visited. They suggest manpower for our short-handed base.",
        answers: [
            "Buying and selling people! Kick out the trader or throw mocking jokes.",
            "Carefully pick a capable worker and lead the deal.",
            "Tremble in fear that I might be sold, or eye the trader's expensive drugs.",
            "Set fire to the trader's goods to cause chaos and run away."
        ]
    },
    112: {
        text: "A sculpture made by a colleague depicts you as fat and ugly.",
        answers: [
            "Inult to my appearance! Smash the sculpture or burn it to ashes.",
            "Haha, good sense of humor. Vow to pay them back later.",
            "Fall into self-loathing or just go to sleep out of lack of interest.",
            "Freedom of expression. Actually, I quite like these curves of mine."
        ]
    },
    113: {
        text: "A psychic wave occurred and all animals in the base started attacking you!",
        answers: [
            "Cannot kill the tamed ones. Scream and run away or hide.",
            "Must survive. Neutralize animals or research a device to calm them.",
            "The noise and screams of this mad battlefield actually excite me.",
            "If I had bionic legs, I would have easily suppressed them... Blame my weak flesh."
        ]
    },
    114: {
        text: "A colleague broke up with their lover and is crying loudly in your room.",
        answers: [
            "Stay by their side all night or give a warm hug to comfort them.",
            "Does love feed you? Coldly tell them to sleep rather than being sad.",
            "Shut up! I have my own problems, why come here and cry?",
            "Advise them to comfort their heart by cleaning machine parts."
        ]
    },
    115: {
        text: "Something dangerous is chasing you and a colleague in a dark forest.",
        answers: [
            "Never! I'll be the bait to save the colleague or find a way together.",
            "Sorry but I must live. Secretly escape alone.",
            "I don't care who it is as long as I live. Hand over the colleague immediately.",
            "Death is just data. Expressionlessly record the process of the colleague dying."
        ]
    },
    116: {
        text: "Food has run out and you've cooked human meat, but can't bring yourself to use a spoon.",
        answers: [
            "Starve to death for dignity or swallow it forcibly while repenting.",
            "It's just for survival. Eat it with an expressionless face.",
            "A forbidden delicacy! Difficult at first but quite good once tried.",
            "Cannot waste nutrients. Consume everything with mechanical precision."
        ]
    },
    117: {
        text: "The plants you were carefully tending all withered and died due to a moment's mistake.",
        answers: [
            "Analyze the cause and start over, or just plant something else.",
            "My effort went to waste! So angry and desperate.",
            "Don't care if they die. Relieved that the workload is reduced.",
            "Think it was quite beautiful to see the plants burning to death."
        ]
    },
    118: {
        text: "Your pet died. How would you handle the body?",
        answers: [
            "They were like family. Hold a funeral or bury them quietly.",
            "Use them as leather or meat to get help until the end.",
            "Just gross and smelly, so throw them into the butchering table immediately.",
            "Start a fire in the room out of sadness and laugh like crazy."
        ]
    },
    119: {
        text: "A close colleague urgently begs you to lend them all your assets.",
        answers: [
            "Cannot ignore them. Lend everything or help as much as possible.",
            "Refuse for friendship, or demand clear proof and interest.",
            "Why my blood-like money? Shout for them to leave immediately.",
            "Soothe them by lending a superconductor battery instead of money."
        ]
    },
    120: {
        text: "You're competing with a colleague for the last seat on the escape ship.",
        answers: [
            "Concede or decide fairly (vote, draw lots).",
            "I must be the one. Board first even by deceiving.",
            "Remove anyone who gets in the way. Don't block my path.",
            "Wish to become one with the machine, even as a part of the ship."
        ]
    },
    121: {
        text: "Power cut due to solar flare and you must cross a 50+ degree desert.",
        answers: [
            "Enjoy the heat or advance silently.",
            "Throw off all clothes and move secretly or whine like collapsing.",
            "Hot to death! So annoyed that I feel like killing anyone.",
            "Endure by imagining the sight of setting fire to the heated sand."
        ]
    },
    122: {
        text: "Lost a leg in an accident. Facing the word that you must wear a wooden prosthetic, you?",
        answers: [
            "Grateful to walk again. Use it and get a better one later.",
            "Wood is rather better than machinery.",
            "Terrible if not a high-performance leg. Want to stay in bed in despair.",
            "I'd give any leg if I could transplant my brain into a computer."
        ]
    },
    123: {
        text: "Food is abundant but the cook insists on serving tasteless nutrient paste every day.",
        answers: [
            "Fine as long as I'm full. The texture of cold paste isn't bad.",
            "Proactively start cooking or try to persuade the cook.",
            "Lose motivation and want to steal food, or grab their collar and shout.",
            "Efficiency over taste! Research if the leftover paste can be used as fuel."
        ]
    },
    124: {
        text: "A friend offers you a 'Smokeleaf' (tobacco) to relieve stress.",
        answers: [
            "The best! Smoke happily or join for social reasons.",
            "Harmful to health. Stop the friend or take the tobacco away.",
            "Dislike smoke, so just watch from the side.",
            "More fun to watch the swirling lotus flames."
        ]
    },
    125: {
        text: "You must work alone in a secluded research lab with no one else.",
        answers: [
            "Perfect isolation! Explore infinite knowledge or work silently.",
            "Going crazy without people. Want to draw a face on the wall.",
            "This is confinement! Want to escape and live glamorously immediately.",
            "Want to turn the isolated fear into hot flames."
        ]
    },
    137: {
        text: "You see a grand space battle in the night sky. Debris is falling.",
        answers: [
            "Wondrous sight! Record the trajectory or collect fallen debris.",
            "Terrifying. Hide in the safe room and pray for safety.",
            "Hope expensive parts fall near my room. Anticipate the wealth.",
            "The light of explosion in space is the ultimate art. Captivated."
        ]
    },
    138: {
        text: "A mystery plague hit the settlement. Everyone is coughing.",
        answers: [
            "Treat them at the risk of infection or find a cure through research.",
            "Isolation is key. Lock the sick ones and stay away.",
            "Anxious about my own health. Steal medicine or stay in bed.",
            "The flush of high fever is like a fire. Interested in the symptoms."
        ]
    },
    139: {
        text: "A mechanoid raid is detected. Ancient machines are coming.",
        answers: [
            "Face them with technology! Hack their systems or use EMP.",
            "Pure machines... they are gods. I want to surrender and join them.",
            "Run away! Machines are soulless and terrifying.",
            "How hot will they burn? I'll use thermal weapons to melt them."
        ]
    },
    140: {
        text: "Found a strange ruin with glowing symbols.",
        answers: [
            "Decrypt the symbols and uncover the ancient secrets.",
            "It looks cursed. Stay away or seal it with walls.",
            "Loot anything that looks valuable and sell it to traders.",
            "The glow is like a cold fire. I'll make a sculpture of it."
        ]
    },
    141: {
        text: "A colleague had a mental break and started wandering aimlessly.",
        answers: [
            "Safely arrest them for their own good or soothe them with words.",
            "Ignore them. Everyone has a bad day, they'll come back.",
            "Annoying. I'll scream at them to get back to work.",
            "Interested in the state of a broken mind for my research."
        ]
    },
    142: {
        text: "A meteor shower is hitting nearby. It's dangerous but beautiful.",
        answers: [
            "Brave the danger to collect rare ores from the impact sites.",
            "Beautiful destruction! Capture the moment in my art.",
            "Fear for my life. Stay in the deepest part of the base.",
            "The impact's heat is amazing. I want to see the fires it starts."
        ]
    },
    143: {
        text: "A manhunter pack of small animals is arriving.",
        answers: [
            "Defend the base with weapons or traps. Efficiency is key.",
            "Waste of time. Close the doors and wait for them to leave.",
            "Terrified of the small bites. Panic and hide under the bed.",
            "A firework of fur and blood! I'll use fire to deal with them."
        ]
    },
    144: {
        text: "A 'Psychic Soothe' is making everyone happy.",
        answers: [
            "Utilize this joy to maximize productivity and harmony.",
            "The peace is artistic. I'll create a masterpiece in this mood.",
            "Artificial happiness is a lie. I suspect a mind control.",
            "Even in this peace, I miss the excitement of a bright flame."
        ]
    },
    145: {
        text: "A powerful 'Psychic Drone' is causing negative voices in your head.",
        answers: [
            "Resist by reading the manual or gain power through research.",
            "Head is splitting! Attack a colleague or run for the drug storage.",
            "The world hates me. Sit in a corner and think only of death.",
            "Translate these voices into machine language to reach the truth."
        ]
    },
    146: {
        text: "A deep psychic drone is lowering everyone's mood.",
        answers: [
            "Maintain discipline and support colleagues through the trial.",
            "Despair. Lost all motivation and just want to cry.",
            "Irrational anger. Start a fight with anyone nearby.",
            "This drone is a signal from the machine god. I'll study it."
        ]
    },
    147: {
        text: "Post-battle scenery... the corpses of enemies are scattered everywhere.",
        answers: [
            "The smell of blood and victory excites me. I want to fight more.",
            "Twisted stomach at the horrible sight. Close eyes and pray.",
            "Quickly handle them to prevent disease, or loot valuable resources.",
            "Make a grand altar of flame using the corpses to celebrate victory."
        ]
    },
    148: {
        text: "Quiet night when everyone is asleep... what are you doing?",
        answers: [
            "Focus on research or meditate under the moonlight.",
            "Fear of the dark. Keep lights bright and wait for others to wake.",
            "Secretly eat something delicious or search others' rooms for secrets.",
            "Light a small fire under the veil of the quiet night."
        ]
    },
    149: {
        text: "A small flame is burning near the fuel storage.",
        answers: [
            "Dangerous! Sound the alarm and extinguish the fire or move fuel.",
            "The dancing flame is so beautiful... entranced by the sight.",
            "Not my business, someone else will do it. Avoid the place.",
            "Burn everything with this fire or imagine something beyond machines."
        ]
    },
    150: {
        text: "Colleagues gifted you a top-tier bionic arm after you lost yours in an accident.",
        answers: [
            "Sad for the loss but moved by colleagues' kindness. Accept it.",
            "Hate machine bodies! Angry at the pollution of flesh or feel depressed.",
            "Gained more power! Want to replace the rest of my body too.",
            "Calculate how much silver I'd get for selling this, or try to melt it."
        ]
    },
    151: {
        text: "The weather is very sunny and the breeze is cool. Your outfit?",
        answers: [
            "Throw off all constraints and become one with nature.",
            "Go to work in neat clothes or show off with fancy silk clothes.",
            "Wear a hazmat suit to avoid sunburn, or just wear anything.",
            "Burn all fibers and set fire to the ground to play."
        ]
    },
    152: {
        text: "Found the last luxurious lavish meal in the storage.",
        answers: [
            "Cannot resist! Even if not hungry, eat it and enjoy the flavor.",
            "Leave it for a hungry colleague or learn the recipe to serve others.",
            "Hide it for fear of criticism or use it as a bait for a deal.",
            "Burn the meal so everyone can at least smell the aroma."
        ]
    },
    153: {
        text: "A colleague is working late into the night. Your reaction?",
        answers: [
            "Diligence is a virtue! Help them finish the work.",
            "Working at night is for night owls. I'll just go to sleep.",
            "They're just trying to look good. I feel jealous.",
            "The light of their lamp is like a small fire. I'll watch it."
        ]
    },
    154: {
        text: "A merchant is selling a mystery box. What's your choice?",
        answers: [
            "Buying a dream! It might contain high-tech parts.",
            "A waste of money. Spend silver on food and medicine instead.",
            "Suspicious. It might contain something dangerous like a trap.",
            "I hope there's something flammable inside. Exciting."
        ]
    },
    155: {
        text: "Found a 'Psychic Shock Lance' in a ruin.",
        answers: [
            "A powerful tool for defense. I'll use it wisely.",
            "Ominous weapon. I want to sell it or destroy it.",
            "Technological marvel! I'll study its principles.",
            "I want to test it on myself to see if it causes a mental fire."
        ]
    },
    156: {
        text: "A strange object fell from the sky. It's a 'Ship Part'.",
        answers: [
            "Analyze the engine and learn the secrets of space flight.",
            "Dangerous debris. Stay away or bury it.",
            "Scrap it for high-quality steel and components.",
            "The wreckage looks like a sculpture. It's beautiful."
        ]
    },
    157: {
        text: "A colleague is telling a joke. Nobody is laughing.",
        answers: [
            "Laugh even if not funny to support the colleague.",
            "Awkward... just walk away or look at the floor.",
            "Tell them to stop the annoying noise and work.",
            "I'll make a better joke by using a torch."
        ]
    },
    158: {
        text: "A 'Psychic Soothe' ended. Everyone feels a bit down.",
        answers: [
            "It was a good dream. Now back to reality with a smile.",
            "Artificial joy is gone. I feel even more depressed now.",
            "I told you it was a lie! Feel justified in my suspicion.",
            "I'll start a real fire to bring back the excitement."
        ]
    },
    159: {
        text: "A 'Psychic Drone' ended. Peace finally returned.",
        answers: [
            "A huge relief. Let's clean the base and celebrate.",
            "Still hear echoes in my head. I'm anxious.",
            "Waste of time. We should have been working during the drone.",
            "The silence is boring. I miss the screaming voices."
        ]
    },
    160: {
        text: "Found a 'Vanometric Power Cell' that generates power for free.",
        answers: [
            "Infinite energy! This is a miracle for our base.",
            "I want it for my own room. Give me the best device.",
            "Ancient magic is untrustworthy. I'll study it carefully.",
            "I'll use this power to create an eternal flame."
        ]
    },
    161: {
        text: "A colleague is asking for a favor. They want to swap rooms.",
        answers: [
            "Sure! If you like mine better, I don't mind the change.",
            "No way. My room is mine. Don't touch my stuff.",
            "Why do they always want what I have? Annoying.",
            "I'll swap after I set a small fire in the corner as a gift."
        ]
    },
    162: {
        text: "A comrade is in critical condition and needs a blood transfusion. You?",
        answers: [
            "Of course! Take as much as needed to save them.",
            "Refuse and tell them to find someone else, or demand a reward.",
            "Secretly inspect or swap their organs during the process.",
            "Spread blood everywhere as a ritual to bond as comrades in madness."
        ]
    },
    163: {
        text: "Dusty cryosleep caskets are lined up in an ancient ruin. No idea what's inside.",
        answers: [
            "Need new colleagues! Open immediately or try to hack the tech.",
            "Dangerous. Prepare a heavy weapon before opening or seal it.",
            "Prepare to suppress them immediately for their gear.",
            "Purify the ancient fear by throwing a molotov inside first."
        ]
    },
    164: {
        text: "Dozens of mad Yorkshire Terrier manhunter pack is rushing. Small but deadly.",
        answers: [
            "Grab a gun for the base or plan to wipe them out with a fire trap.",
            "The best meat party! Hunt with joy or sketch their madness.",
            "Scary! Hide under the bed and lock the door trembling.",
            "Extract puppy brains to combine with machines for security units."
        ]
    },
    165: {
        text: "The meanest prisoner broke the door and escaped with a knife!",
        answers: [
            "Kill immediately for order or suppress with a duel.",
            "Try to negotiate or run away and hide in fear.",
            "Re-imprison after light punishment, then give a harsher sentence.",
            "Set fire to the prison so they never come out again."
        ]
    },
    166: {
        text: "Stress reached its limit. What kind of impulse do you feel now?",
        answers: [
            "Give in to drug cravings or sadistic bloodlust.",
            "Go mad in isolation or vent by smashing valuables.",
            "Work like crazy to forget the thoughts.",
            "Want to extract my brain and insert a chip to control emotions perfectly."
        ]
    },
    167: {
        text: "In a blinding sandstorm, you want to wander aimlessly without purpose.",
        answers: [
            "Leave myself to nature or walk hoping someone catches me.",
            "Cry miserably thinking others will mock, or wish the storm wipes the base.",
            "Lose track of time picking up shiny fragments in the storm.",
            "Imagine trial would be joy if I had a steel body."
        ]
    },
    168: {
        text: "Dead feel more comfortable than the living. Want to put a corpse on the table.",
        answers: [
            "Have dinner with the corpse or prove pain through a ritual.",
            "Scream and have a seizure, demanding the dirty corpse be removed.",
            "Precisely record the decay to find the secret of life extension.",
            "Convert the corpse into an art piece by inserting machine parts."
        ]
    },
    169: {
        text: "A colleague's words are too annoying. Violence starts rising inside.",
        answers: [
            "Weakness is a sin. Engrave the world's law on their body.",
            "Meditate to suppress violence or take drugs to calm the aggression.",
            "Pessimistic about becoming a monster or induce self-defense to crush them.",
            "Punch the machine devices on the workbench instead of people."
        ]
    },
    170: {
        text: "Reason is gone, only instinct remains. Everyone looks like an enemy.",
        answers: [
            "Kill them all! Swing anything feeling the exploding energy.",
            "Hold on to the last reason and cry, hoping colleagues suppress me.",
            "Smash expensive things or cruelly attack finding weaknesses.",
            "Try to purify all life by turning the base into a huge crematorium."
        ]
    },
    171: {
        text: "A competition to pick the best cook is held. Your ultimate skill?",
        answers: [
            "Present a soul-healing feast or a mystery steak.",
            "Offer a futuristic nutrient pill or an artistic food.",
            "Make people drunk with party food full of alcohol.",
            "Show the aesthetics of flame with a food-burning performance."
        ]
    },
    172: {
        text: "Asked to name a newborn calf.",
        answers: [
            "Give a pretty lyrical name for the settlement's prosperity.",
            "Treat it as an asset with a number or think of it as food after butchering.",
            "Name it to look stupid out of jealousy for more love it gets.",
            "Name it 'Mecha' hoping it becomes a high-performance cyborg cow later."
        ]
    },
    173: {
        text: "You miraculously finished a 'Masterwork' sofa. Everyone cheers.",
        answers: [
            "Modestly say thanks or show off genius saying it's natural.",
            "Sit there all day or suggest selling it immediately for high-tech weapons.",
            "Smash and rebuild for a more perfect fantasy.",
            "Upgrade to a 'Smart Sofa' by embedding precise machine parts."
        ]
    },
    174: {
        text: "An allied ambassador accidentally broke a sculpture. Your reaction?",
        answers: [
            "Overlook for friendship or clean it up silently with comfort.",
            "Charge Silver equal to value or force a disadvantageous treaty.",
            "Pour verbal abuse and shout for them to leave immediately.",
            "Mark the mistake by setting fire to the broken spot."
        ]
    },
    175: {
        text: "The last electric cooler broke in the heatwave. Temperature rises rapidly.",
        answers: [
            "Grab repair tools and jump into the machine room or lead the evacuation.",
            "Strip naked and lie on a corpse in the freezer or march to the flames.",
            "Inverse research to produce power using the heat.",
            "Wish to replace skin with cool metal plates."
        ]
    },
    176: {
        text: "A volcanic winter started. The sky is dark and cold.",
        answers: [
            "Endure with hope. Light a fire and keep the base warm.",
            "This is the end! Panic and despair in the dark.",
            "Research a new way to grow plants without sunlight.",
            "The dark sky is a perfect canvas for my fire art."
        ]
    },
    177: {
        text: "A trade caravan is leaving. They have high-quality items.",
        answers: [
            "Trade everything for that one legendary item! I must have it.",
            "Ignore them. We have enough to survive.",
            "Jealous of their wealth. I want to rob them.",
            "The technology they use... I'll take it by force if needed."
        ]
    },
    178: {
        text: "A 'Psychic Ship' is landing. The hum is getting louder.",
        answers: [
            "Destroy it before it drives us mad! Arm up.",
            "The hum is a beautiful melody. I want to listen to it.",
            "Terrifying! I'll hide in the deepest cave.",
            "The machine's power... I'll merge my mind with it."
        ]
    },
    179: {
        text: "A colleague is sick and needs help with work. You?",
        answers: [
            "Of course! I'll do their work and mine too.",
            "Not my problem. They should have been more careful.",
            "I'll help but demand a portion of their assets later.",
            "I'll fix them with a bionic heart so they can work more."
        ]
    },
    180: {
        text: "A meteor of 'Gold' hit the base! Your feel?",
        answers: [
            "Wealth! I'll be the richest person on this planet.",
            "Grateful for the resource. I'll use it for the colony.",
            "Boring. Gold is just metal. Steel is more useful.",
            "The golden glow... I'll make a statue of a machine god."
        ]
    },
    181: {
        text: "A 'Poison Ship' is killing the forest. What to do?",
        answers: [
            "Attack it now! Every tree is precious.",
            "Let it kill. The grey forest looks better than green.",
            "Scared of the mechanoids. I won't go near it.",
            "The dying forest is the perfect fuel for a huge fire."
        ]
    },
    182: {
        text: "A 'Defoliator Ship' hit. Trees are withering.",
        answers: [
            "Stop the ship! We need wood for the base.",
            "Trees are just wood. I don't care about the forest.",
            "The ship's tech is amazing. I want to study it.",
            "The withering trees look like skeletons. Artistic."
        ]
    },
    183: {
        text: "Found an 'Orbital Bombardment Targeter'. One use only.",
        answers: [
            "Divine power! I'll save it for the final enemy.",
            "Too dangerous. I want to sell it for a high price.",
            "The technology... I want to replicate it.",
            "I'll use it on a random spot just to see the explosion."
        ]
    },
    184: {
        text: "A 'Psychic Shock Lance' was used on you! You're down.",
        answers: [
            "My mind is on fire! Pain and revelation.",
            "Unfair! I'll kill whoever did this to me.",
            "Machines are cowards. I'll stick to my club.",
            "This experience... it made me feel closer to the machine god."
        ]
    },
    185: {
        text: "A 'Psychic Insanity Lance' made you attack your friends.",
        answers: [
            "I'm devastated... what have I done?",
            "They deserved it anyway. It was fun.",
            "The madness was like a drug. I want more.",
            "I'll replace my brain with a computer to prevent this."
        ]
    },
    186: {
        text: "A 'Shield Belt' saved your life from a bullet.",
        answers: [
            "Technology is the savior! I'll upgrade it even further.",
            "Lucky... but next time I'll be more careful.",
            "The blue glow of the shield is my favorite color.",
            "I'll make a fire that can penetrate even this shield."
        ]
    },
    187: {
        text: "A beautiful aurora in the night sky. Your move?",
        answers: [
            "Watch all night or swear love with a lover.",
            "Check power efficiency or close windows for safety.",
            "Annoyed at the thought of working tomorrow.",
            "Light a fire to harmonize the sky and the ground."
        ]
    },
    188: {
        text: "A huge 'Silver' meteorite fell. Pure silver block.",
        answers: [
            "Fill storage and make beds/doors to improve life quality.",
            "Grateful it didn't hit the base, or analyze external traces.",
            "Sell as 'Silver Statue' by carving fragments.",
            "Want to plate my body in silver to look beautiful."
        ]
    },
    189: {
        text: "Mystery cargo pods contain top-tier spices and alcohol.",
        answers: [
            "Hide expensive alcohol or sell for auto turrets.",
            "Hold a feast or check for poison trap.",
            "Drunk on aroma and don't work for days.",
            "Start a bonfire for a fragrant flame festival."
        ]
    },
    190: {
        text: "Found abandoned ancient city ruins. How to handle relics?",
        answers: [
            "Move to lab for preservation or read ancient documents.",
            "Take only valuable ones or disassemble useful gear.",
            "Unlucky grave, so smash and use as building material.",
            "Tear out machine devices for body reinforcement tech."
        ]
    },
    191: {
        text: "Enemy commander is too strong. You have a Psychic Shock Lance.",
        answers: [
            "Pull trigger for comrades or operate carefully in awe of tech.",
            "Enjoy their screams or reuse brain for machine servant core.",
            "Rush with a knife since expensive weapon is a waste.",
            "Pity the enemy and try to negotiate peace."
        ]
    },
    192: {
        text: "Used Insanity Lance on enemies to make them fight each other. Feeling?",
        answers: [
            "Satisfied with comedy or efficient tactics.",
            "Guilt-ridden or ecstatic seeing the flames in the madness.",
            "Want to shoot myself a bit to get excited.",
            "Analyze the weapon's principle for the next device."
        ]
    },
    193: {
        text: "Wearing high-tech Shield Belt. Bullets now miss you.",
        answers: [
            "Advance confidently or feel like a superior being.",
            "Be cautious behind cover or fear the shield breaking.",
            "Pose in front of the mirror and enjoy the light.",
            "Plan to cause a massive explosion and fire in case of emergency."
        ]
    },
    194: {
        text: "You are wearing a sturdy 'Marine Armor'. How do you feel?",
        answers: [
            "Feel like an invincible hero! I'll protect everyone in the front.",
            "Safe but heavy. I'll do my job steadily.",
            "Hate the confinement and want to take it off, or fear scratches.",
            "Ecstatic feeling the connection with the mechanical complex."
        ]
    },
    195: {
        text: "Aiming the 'Doomsday Rocket Launcher' that can blow up a base.",
        answers: [
            "Enjoy the powerful aesthetics of destruction. True leader.",
            "Worry about lives disappearing or dislike the messy smoke trail.",
            "Calculate the most efficient trajectory for total annihilation.",
            "Research if I can cause a even larger firestorm."
        ]
    },
    196: {
        text: "Orbital Bombardment activated. God-like lasers are falling.",
        answers: [
            "Enjoy the cosmic power and get artistic inspiration.",
            "Despair at the hellish sight or dislike the dust flying.",
            "Lick lips calculating the value of resources remaining.",
            "Wish every place becomes a golden field burning."
        ]
    },
    197: {
        text: "Obtained 'Resurrection Mech Serum' for a dead colleague. Only one.",
        answers: [
            "Use it as a miracle or save it for my own death later.",
            "Worry about side effects or throw it away fearing their popularity.",
            "Disassemble to analyze the nano-technology.",
            "Try to convert them into a permanent machine administrator."
        ]
    },
    198: {
        text: "Found 'Healer Mech Serum'. You have a scar, colleague has cancer.",
        answers: [
            "Give to colleague or use on a more useful person.",
            "Heal my scar first or save for a more critical future.",
            "Try to split in half but ruin it.",
            "Hold a purification ritual by sublimating healing energy into flame."
        ]
    },
    199: {
        text: "Found 'Luciferium'. Makes you superhuman but die without it for life.",
        answers: [
            "Drink it to be superhuman or feed a weakling as a human shield.",
            "Resist temptation and incinerate or sell for silver.",
            "Burst into tears at the fear of supply running out.",
            "Pour into fire to spread the seductive scent throughout the village."
        ]
    },
    200: {
        text: "Long time passed in the Rimworld and you look in the mirror. Who are you?",
        answers: [
            "Gracious pioneer or a winner who didn't care about means.",
            "Pioneer near the truth or a laborer who survived a day.",
            "A monster broken by the planet.",
            "Follower of flame dreaming of a start by burning everything."
        ]
    },
    201: {
        text: "What was your childhood like?",
        answers: [
            "Bright and social. Loved by everyone.",
            "Difficult and lonely. Survived on my own.",
            "Fascinated by machines even as a kid.",
            "Always found peace in the forest or with animals."
        ]
    },
    202: {
        text: "What kind of student were you?",
        answers: [
            "Model student or a technical nerd.",
            "Troublemaker or a star athlete.",
            "Quiet student drawing in a corner.",
            "Forest and fields were my classroom."
        ]
    },
    203: {
        text: "How was your early work life?",
        answers: [
            "Promising expert or a respected leader.",
            "Slave in a pirate gang or an orphan.",
            "Experimental subject born in a lab.",
            "Ordinary and quiet citizen."
        ]
    },
    204: {
        text: "What was the hardest thing in your social life?",
        answers: [
            "Fake smiles or unfair treatment.",
            "Simple labor or irrational orders from bosses.",
            "Stress of stepping over competitors to rise.",
            "Nothing was hard. I enjoy working."
        ]
    },
    205: {
        text: "In this hellish Rimworld, what is your ultimate goal?",
        answers: [
            "Build a ship or establish an empire to escape/rule.",
            "Build a fortress and crush enemies or build a civilization.",
            "Farm quietly and raise animals for peace.",
            "Just survive day by day without dying."
        ]
    },
    206: {
        text: "If you could change one thing about yourself?",
        answers: [
            "Be smarter or more talented in skills.",
            "Be stronger or more beautiful in appearance.",
            "Be kinder or more social with people.",
            "Replace my whole body with machines."
        ]
    },
    207: {
        text: "What do you value most in a person?",
        answers: [
            "Honesty and kindness.",
            "Skill and efficiency.",
            "Loyalty and bravery.",
            "Beauty and artistic sense."
        ]
    },
    208: {
        text: "How did you live before the crash?",
        answers: [
            "Had a great success or honor.",
            "Struggled to survive in the underworld.",
            "Lived a normal life with no special accidents.",
            "Focused only on research and technology."
        ]
    },
    209: {
        text: "Last memory before the crash on Rimworld?",
        answers: [
            "Ship alarm or the cold of cryosleep.",
            "Screams and hot heat of exploding engine.",
            "Beautiful nameless nebula seen through the window.",
            "Don't remember anything."
        ]
    },
    210: {
        text: "If God (Player) granted one wish?",
        answers: [
            "Infinite wealth or all knowledge and skills.",
            "Immortal body or perfect beautiful appearance.",
            "A true partner who understands me.",
            "Just leave me alone."
        ]
    },
    211: {
        text: "What was your family or origin like?",
        answers: [
            "Ruling noble family or tribal elder heir.",
            "Pirate slave or child from an orphanage.",
            "Gene-mod experimental subject born in a lab.",
            "Ordinary and quiet citizen."
        ]
    },
    212: {
        text: "In school, what kind of student were you?",
        answers: [
            "Top of class or a coding nerd.",
            "Problem child or a shining athlete during PE.",
            "Student who only drew in the corner.",
            "Forests and fields were my classroom."
        ]
    },
    213: {
        text: "What was the hardest part of social life?",
        answers: [
            "Hypocritical smiles or unfair treatment.",
            "Simple labor or irrational orders from the boss.",
            "Stress of having to step over competitors.",
            "Nothing hard. I enjoy working."
        ]
    },
    214: {
        text: "What do you regret most among past choices?",
        answers: [
            "Losing a loved one or not fighting more bravely.",
            "Missing a chance for money or not studying more.",
            "Neglecting health and overworking my body.",
            "No regrets. Everything made who I am."
        ]
    },
    215: {
        text: "In far future, how do you want to be remembered?",
        answers: [
            "As a savior or a good person to family/friends.",
            "As a ruler or a genius inventor ahead of time.",
            "As a craftsman who left legendary works.",
            "Don't want to be remembered. Disappear quietly."
        ]
    },
    1001: {
        text: "A fire broke out in the storage! What's your immediate reaction?",
        answers: [
            "Extinguish the fire right away! Every single item is precious.",
            "Beautiful flames! I'll just watch and enjoy the heat.",
            "Too scared to go near the fire. I'll call someone else.",
            "Is the fire safe for my bionic arm? I'll check the manual first."
        ]
    },
    1002: {
        text: "We lack researchers. Will you start the difficult study?",
        answers: [
            "Research is my passion! I'll uncover the secrets of this planet.",
            "Too complex, my head hurts. I'd rather do manual labor.",
            "I'll do it if it helps me gain more power or wealth.",
            "I want to research how to become a machine myself."
        ]
    },
    1003: {
        text: "An enemy is bleeding out. Will you treat them?",
        answers: [
            "Every life is sacred. I'll treat them and offer a place here.",
            "Use them for practice! I'll learn surgery by cutting them.",
            "Waste of medicine. Just let them be or finish them.",
            "I'll transplant their organs into my body for reinforcement."
        ]
    },
    1019: {
        text: "What material do you want for your clothes in Rimworld?",
        answers: [
            "Legendary leather and silk that gives warrior's dignity and lets me dance in fire.",
            "Fine linen or high-tech hyperweave that repels bullets.",
            "Human leather... this strange soft texture is so good.",
            "Clothes don't matter. I'll wear anything just to cover my body."
        ]
    },
    1020: {
        text: "Directed to operate a ground scanner to find resources deep underground.",
        answers: [
            "Analyze data to find great veins or design geothermal energy for base.",
            "Operate scanner skillfully and explore resource deposits silently.",
            "More fun to dig directly with a pickaxe rather than machines.",
            "Lie that it's broken and rest. Only dirt will come out anyway."
        ]
    },
    1021: {
        text: "Must extract chemfuel from milking boomalopes. Dangerous work.",
        answers: [
            "Milking skillfully, or rather see the spectacle of chain explosions.",
            "Inspect gear or build bond with them to perform safely.",
            "Dislike boomalopes. Want to hunt them all.",
            "Scary! why give me this work when they might explode at touch?"
        ]
    },
    1022: {
        text: "Enemy mortar is shelling the base. Must counter-attack to destroy their position.",
        answers: [
            "Precisely calculate trajectory or turn enemy base into hell with incendiary shells.",
            "Quickly load shells or just shoot a lot first!",
            "Stay steady in position and help without being shaken by shelling.",
            "Too loud and scary. Hide in the corner covering ears."
        ]
    },
    1023: {
        text: "Suggested to start ranching with hundreds of animals.",
        answers: [
            "Build huge ranch communicating with animals or realize perfect ranching with high-tech.",
            "Care for animals like family in a peaceful atmosphere.",
            "Management is annoying. Just hunt or butcher for meat and leather.",
            "Nauseous at smell and filth. Dislike this work and don't want to touch."
        ]
    },
    1024: {
        text: "Legendary grade weapon completed using expensive materials.",
        answers: [
            "Relic of glory or upgrade to a burning magic sword.",
            "Want to use on battlefield immediately. Can cut thousands of heads.",
            "Test performance thoroughly or sell for high price to feed base.",
            "Too expensive to use. Hide deep in the storage."
        ]
    },
    1025: {
        text: "Finally escape ship completed. One more seat left.",
        answers: [
            "I should go for human knowledge or design aesthetics of destruction with fireworks.",
            "I'll stay here to protect the rest. You go.",
            "Most hardworking colleague should go. Decide by vote.",
            "I'll take it by any means, or no one goes since it's hell anyway."
        ]
    }
};

const updatedEnData = koData.map(koItem => {
    const translation = translations[koItem.id];
    if (translation) {
        return {
            ...koItem,
            text: translation.text,
            answers: koItem.answers.map((koAnswer, idx) => ({
                ...koAnswer,
                text: translation.answers[idx] || koAnswer.text
            }))
        };
    }
    const existingEn = enData.find(enItem => enItem.id === koItem.id);
    if (existingEn && (existingEn.groupId || existingEn.id > 1000)) {
        return {
            ...koItem,
            text: existingEn.text,
            answers: koItem.answers.map((koAnswer, idx) => {
                const enAns = existingEn.answers[idx];
                return {
                    ...koAnswer,
                    text: enAns ? enAns.text : koAnswer.text
                };
            })
        };
    }
    return koItem;
});

fs.writeFileSync(enPath, JSON.stringify(updatedEnData, null, 4));
console.log('Successfully updated questions_en.json for all IDs (1-1025)');
