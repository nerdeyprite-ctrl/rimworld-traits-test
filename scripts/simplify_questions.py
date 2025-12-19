import json
import re

def simplify_text(text):
    # Aggressively remove unnecessary adjectives, adverbs, and emotional intensifiers
    removals = [
        r'꼬르륵 소리가 나는\s*',
        r'한없이\s*',
        r'미친 듯이\s*',
        r'비참하게\s*',
        r'처절한\s*',
        r'지옥 같은\s*',
        r'피 칠갑이 된\s*',
        r'칠흑 같은\s*',
        r'시빨건\s*',
        r'격렬하게\s*',
        r'필사적으로\s*',
        r'피가 거꾸로 솟지만\s*',
        r'소리 없이\s*',
        r'은밀하게\s*',
        r'비릿한\s*',
        r'끔찍한\s*',
        r'무섭게\s*',
        r'미력하게나마\s*',
        r'군말 없이\s*',
        r'묵묵히\s*',
        r'꾸벅꾸벅\s*',
        r'서러운\s*',
        r'칙칙한\s*',
        r'비좁고 축축한\s*',
        r'축축한\s*',
        r'눅눅한\s*',
        r'매우\s*',
        r'상당히\s*',
        r'굉장히\s*',
        r'극심한\s*',
        r'치열한\s*',
        r'압도적인\s*',
        r'호화로운\s*',
        r'지긋지긋한\s*',
        r'고약한\s*',
        r'비위생적인\s*',
        r'눈물이 북받쳐\s*',
        r'훌쩍이며\s*',
        r'거릴게\s*',
        r'거칠게\s*',
        r'정체 모를\s*',
        r'불쾌한\s*',
        r'신나는\s*',
        r'서글프지만\s*',
        r'막무가내\s*',
        r'단단히\s*',
        r'따뜻한\s*',
        r'차분하게\s*',
        r'냉정하게\s*',
        r'철저히\s*',
        r'은밀히\s*',
        r'노골적으로\s*',
        r'지극히\s*',
        r'흔쾌히\s*',
        r'진심 어린\s*',
        r'수줍게\s*',
        r'강렬한\s*',
        r'본능적으로\s*',
        r'묘한\s*',
        r'전설적인\s*',
        r'찬란한\s*',
        r'눈부신\s*',
        r'기괴한\s*',
        r'형편없는\s*',
        r'가혹한\s*',
        r'험난한\s*',
        r'비천한\s*',
        r'웅장한\s*',
        r'엄중한\s*',
        r'필요 이상으로\s*',
        r'쓸데없이\s*',
        r'속절없이\s*',
        r'화끈하게\s*',
        r'미지의\s*',
        r'소중한\s*',
        r'필사적인\s*',
        r'냉정히\s*',
        r'집요하게\s*',
        r'조용히\s*',
        r'묵묵한\s*',
        r'성실함이 내 무기다\.?\s*', # trimming extra flavor
        r'완벽한\s*',
        r'고도로\s*',
        r'엄청난\s*',
        r'대단한\s*',
        r'깊은\s*',
        r'작은\s*', # trim descriptors if they don't change meaning
        r'거대한\s*',
        r'광활한\s*',
    ]
    
    for p in removals:
        text = re.sub(p, '', text)
        
    text = re.sub(r'\s+', ' ', text).strip()
    return text

def main():
    path = '/Users/choihajin/Desktop/변방계 정착민 테스트/data/questions_ko.json'
    with open(path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    for item in data:
        for ans in item['answers']:
            ans['text'] = simplify_text(ans['text'])
            
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=4)
    print("Done")

if __name__ == "__main__":
    main()
