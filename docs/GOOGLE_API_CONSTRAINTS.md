# Google Classroom and Drive API Constraint Register

Checked: 2026-09-22. Sources below are primary Google documentation.

## Classroom submission / turn-in
1. `StudentSubmission` records are generated when `CourseWork` is created; a submission is not a generic document-upload endpoint. Assignment submission content can be changed through `studentSubmissions.modifyAttachments`. [StudentSubmission reference](https://developers.google.com/workspace/classroom/reference/rest/v1/courses.courseWork.studentSubmissions)
2. `turnIn` may be called only by the student who owns the identified submission. It requires `https://www.googleapis.com/auth/classroom.coursework.me`. [turnIn reference](https://developers.google.com/workspace/classroom/reference/rest/v1/courses.courseWork.studentSubmissions/turnIn)
3. The turn-in request must originate from the Developer Console project of the OAuth client that created the matching coursework item **or** an add-on attachment on it. Therefore ClassPilot cannot reliably turn in arbitrary pre-existing teacher assignments; a future feature must prove client-project/attachment association before exposing the action. [turnIn reference](https://developers.google.com/workspace/classroom/reference/rest/v1/courses.courseWork.studentSubmissions/turnIn)
4. Developers can turn in, reclaim, or return a submission only for coursework that includes one of their add-on attachments; developers can only finalize grades for individual submissions on assignments they created. [Classroom API structure](https://developers.google.com/workspace/classroom/guides/key-concepts/api-structure)
5. `return` is teacher-only and has the same client-project creation/attachment constraint; it is not a student capability. [return reference](https://developers.google.com/workspace/classroom/reference/rest/v1/courses.courseWork.studentSubmissions/return)
6. Some Classroom API features require particular Google Workspace for Education license types; target-domain eligibility must be verified. [Classroom overview](https://developers.google.com/workspace/classroom/guides/get-started)

## OAuth and Drive
1. Classroom scopes should be selected narrowly; public apps accessing certain user data may require Google verification. [Classroom authorization guide](https://developers.google.com/workspace/classroom/guides/auth)
2. `classroom.student-submissions.me.readonly` is read-only for the requesting student's coursework/grades; it cannot turn in. `classroom.coursework.me` is the turn-in scope. [Classroom authorization guide](https://developers.google.com/workspace/classroom/guides/auth)
3. Drive API requires OAuth 2.0. Prefer `drive.file`, which limits access to files the user uses with the app, rather than broad `drive` / `drive.readonly` when Picker-mediated selection suffices. [Drive scope catalog](https://developers.google.com/identity/protocols/oauth2/scopes) and [Drive overview](https://developers.google.com/drive/api/guides/about-sdk)

## Product decision
Sprint 1 remains read-only. The extension may later offer user-selected Drive files under the narrowest viable scope. No turn-in, attachment modification, grade, return, reclaim, or coursework creation is planned without a separate capability review, explicit confirmation UX, scope approval, and live ownership/eligibility tests.
