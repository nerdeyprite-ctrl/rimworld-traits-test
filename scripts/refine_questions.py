import json
import re

def refine_question(text):
    patterns = [
        (r'어떻게 (반응|대응|행동|선택)하시겠습니까\?$', '.'),
        (r'오늘 하루를 어떻게 보내시겠습니까\?$', '.'),
        (r'당신의 (본능은 어떻|선택은 어떻|태도는 어떻|본능은 어떻)게 움직입니까\?$', '.'),
        (r'당신은 평소 어떤 속도로 움직입니까\?$', '.'),
        (r'당신은 무엇을 하고 있나요\?$', '.'),
        (r'배고픔에 시달리는 당신의 선택은\?$', '.'),
        (r'당신의 태도는 어떤가요\?$', '.'),
        (r'당신의 선택은\?$', '.'),
        (r'당신의 입에서 나온 첫마디는\?$', '.'),
        (r'언제인가요\?$', '.'),
        (r'당신의 첫 비평은\?$', '.'),
        (r'당신의 본능은 어떻게 움직입니까\?$', '.'),
        (r'무엇을 하고 있습니까\?$', '.')
    ]
    
    for p, repl in patterns:
        text = re.sub(p, repl, text)
    
    if text.endswith('?'):
        parts = re.split(r'(?<=[.!?])\s+', text)
        if len(parts) > 1:
            last = parts[-1]
            if any(q in last for q in ['어떻게', '무엇을', '어떤', '어느', '인가요', '있나요', '함니까', '합니까', '있습니까']):
                text = ' '.join(parts[:-1])

    text = text.strip()
    text = re.sub(r'\.\s*\.$', '.', text)
    if text and text[-1] not in ['.', '!', '?']:
        text += '.'
        
    return text

def refine_answer(text):
    def r(pattern, replacement, input_text):
        return re.sub(pattern + r'(?=[.!?]|$)', replacement, input_text)

    # 0. Fix previous run errors
    text = r('대결다', '대결이다', text)
    text = r('찾다', '찾는다', text)
    text = r('나갑다', '나간다', text)

    # Verb endings
    text = r('나갑니다', '나간다', text)
    text = r('나옵니다', '나온다', text)
    text = r('봅니다', '본다', text)
    text = r('합니다', '한다', text)
    text = r('됩니다', '된다', text)
    text = r('해집니다', '해진다', text)
    text = r('집니다', '진다', text)
    text = r('흐릅니다', '흐른다', text)
    text = r('흘립니다', '흘린다', text)
    text = r('칩니다', '친다', text)
    text = r('립니다', '린다', text)
    text = r('웁니다', '운다', text)
    
    # Existential
    text = r('있습니다', '있다', text)
    text = r('없습니다', '없다', text)
    
    # Adjectives / Consonant-stem verbs
    text = r('입니다', '이다', text)
    
    # Specific common verbs ending in consonant
    verbs_con = ['찾', '먹', '입', '잡', '닦', '씻', '얻', '싣', '속', '믿', '웃']
    for v in verbs_con:
        text = r(v + '습니다', v + '는다', text)
        
    # General fallback for ~습니다
    text = r('습니다', '다', text)
    
    # Fix Adjectives becoming "한다"
    adjectives = ['필요', '정당', '명쾌', '불쾌', '유쾌', '충분', '당연', '비참', '조용', '동일', '비슷']
    for adj in adjectives:
        text = r(adj + '한다', adj + '하다', text)

    # Politeness/Ending conversions
    text = r('야죠', '야지', text)
    text = r('하죠', '하지', text)
    text = r('이죠', '이지', text)
    text = r('네요', '네', text)
    text = r('군요', '군', text)
    text = r('게요', '게', text)
    text = r('해요', '해', text)
    text = r('예요', '야', text)
    text = r('이에요', '이야', text)
    text = r('보겠습니다', '보겠다', text)
    text = r('하겠습니다', '하겠다', text)
    text = r('가겠습니다', '가겠다', text)
    text = r('거예요', '거야', text)
    text = r('봐요', '봐', text)
    
    return text

def main():
    path = '/Users/choihajin/Desktop/변방계 정착민 테스트/data/questions_ko.json'
    with open(path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    for item in data:
        item['text'] = refine_question(item['text'])
        for ans in item['answers']:
            ans['text'] = refine_answer(ans['text'])
            
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=4)
    print("Done")

if __name__ == "__main__":
    main()
