# 카카오톡 공유 기능 설정 가이드

## 📋 개요
카카오톡 공유 기능을 사용하려면 Kakao Developers에서 앱을 등록하고 JavaScript Key를 발급받아야 합니다.

## 🔑 1단계: Kakao Developers 계정 생성

1. **Kakao Developers 접속**
   - URL: https://developers.kakao.com/
   - 우측 상단 "로그인" 클릭

2. **카카오 계정으로 로그인**
   - 기존 카카오톡 계정 사용
   - 없다면 회원가입 진행

## 🏗️ 2단계: 애플리케이션 등록

1. **내 애플리케이션 메뉴 이동**
   - 로그인 후 우측 상단 프로필 클릭
   - "내 애플리케이션" 선택
   - URL: https://developers.kakao.com/console/app

2. **애플리케이션 추가하기**
   - "애플리케이션 추가하기" 버튼 클릭
   - 앱 이름 입력: `변방계 정착민 테스트` (또는 원하는 이름)
   - 사업자명 입력: 개인 이름 또는 회사명
   - "저장" 클릭

3. **앱 생성 완료**
   - 앱이 생성되면 자동으로 앱 설정 페이지로 이동
   - 앱 키 섹션에서 **JavaScript 키** 확인 가능

## 🔐 3단계: JavaScript 키 확인

1. **앱 키 섹션 확인**
   - 좌측 메뉴에서 "앱 설정" > "요약 정보" 클릭
   - "앱 키" 섹션에서 다음 키들 확인:
     - REST API 키
     - **JavaScript 키** ⭐ (이것을 사용합니다!)
     - Admin 키

2. **JavaScript 키 복사**
   - JavaScript 키 옆의 복사 버튼 클릭
   - 예시: `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6`

## 🌐 4단계: 플랫폼 등록

카카오톡 공유가 작동하려면 웹 플랫폼을 등록해야 합니다.

1. **플랫폼 설정 메뉴 이동**
   - 좌측 메뉴에서 "앱 설정" > "플랫폼" 클릭

2. **Web 플랫폼 등록**
   - "Web 플랫폼 등록" 버튼 클릭
   - 사이트 도메인 입력:
     - 개발: `http://localhost:3000`
     - 프로덕션: `https://test.ratkin.org`
   - 여러 도메인 등록 가능 (줄바꿈으로 구분)
   - "저장" 클릭

3. **등록 예시**
   ```
   http://localhost:3000
   https://test.ratkin.org
   ```

## ⚙️ 5단계: 코드에 JavaScript 키 적용

1. **ShareButtons.tsx 파일 열기**
   - 경로: `components/ShareButtons.tsx`

2. **JavaScript 키 입력**
   - 50번째 줄 근처의 `YOUR_KAKAO_JAVASCRIPT_KEY` 부분 찾기
   - 복사한 JavaScript 키로 교체

   **변경 전:**
   ```typescript
   window.Kakao.init('YOUR_KAKAO_JAVASCRIPT_KEY');
   ```

   **변경 후:**
   ```typescript
   window.Kakao.init('a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6');
   ```

3. **파일 저장 및 커밋**
   ```bash
   git add components/ShareButtons.tsx
   git commit -m "feat: add Kakao JavaScript Key"
   git push
   ```

## 🧪 6단계: 테스트

1. **로컬 테스트**
   ```bash
   npm run dev
   ```
   - http://localhost:3000 접속
   - 테스트 완료 후 결과 페이지에서 카카오톡 공유 버튼 클릭
   - 카카오톡 공유 팝업이 정상적으로 뜨는지 확인

2. **프로덕션 테스트**
   - https://test.ratkin.org 접속
   - 동일하게 카카오톡 공유 버튼 테스트

## ❗ 문제 해결

### 문제 1: "Kakao SDK not initialized" 에러
**원인**: JavaScript 키가 잘못되었거나 입력되지 않음

**해결**:
- JavaScript 키를 다시 확인
- 따옴표 안에 정확히 입력했는지 확인
- 공백이나 특수문자가 없는지 확인

### 문제 2: "도메인이 등록되지 않았습니다" 에러
**원인**: 플랫폼에 도메인이 등록되지 않음

**해결**:
- Kakao Developers > 앱 설정 > 플랫폼에서 도메인 확인
- 현재 접속 중인 도메인이 등록되어 있는지 확인
- 프로토콜(http/https)까지 정확히 일치해야 함

### 문제 3: 공유 이미지가 안 보임
**원인**: 동적 OG 이미지 생성 API 문제

**해결**:
- `/api/og` 엔드포인트가 정상 작동하는지 확인
- 브라우저에서 직접 접속: `https://test.ratkin.org/api/og?name=테스트&mbti=ENFP`
- 이미지가 표시되는지 확인

### 문제 4: 모바일에서 공유가 안 됨
**원인**: 카카오톡 앱이 설치되지 않음

**해결**:
- 카카오톡 앱 설치 확인
- 모바일 브라우저에서 팝업 차단 해제
- 카카오톡 앱 최신 버전으로 업데이트

## 📚 추가 참고 자료

- **Kakao Developers 문서**: https://developers.kakao.com/docs/latest/ko/message/js
- **카카오톡 공유 가이드**: https://developers.kakao.com/docs/latest/ko/message/js-link
- **플랫폼 등록 가이드**: https://developers.kakao.com/docs/latest/ko/getting-started/app

## 🔒 보안 주의사항

1. **JavaScript 키는 공개되어도 안전합니다**
   - 클라이언트 사이드에서 사용하는 키
   - GitHub에 커밋해도 문제없음
   - 단, Admin 키나 REST API 키는 절대 공개하지 마세요!

2. **도메인 제한**
   - 등록된 도메인에서만 작동
   - 악의적인 사용 방지

3. **사용량 제한**
   - 무료 플랜: 일 10,000건
   - 초과 시 유료 플랜 전환 필요

---

**설정 완료 후 예상 소요 시간**: 약 10분  
**난이도**: ⭐⭐☆☆☆ (쉬움)

문제가 발생하면 Kakao Developers 고객센터에 문의하세요!
