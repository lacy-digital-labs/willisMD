# User Story

**Story ID:** [PROJ-XXX]  
**Epic:** [Parent Epic Name]  
**Sprint:** [Sprint Number]  
**Priority:** High / Medium / Low  
**Story Points:** [1, 2, 3, 5, 8, 13]  
**Created:** [Date]  
**Author:** [Name]

---

## Story

### User Story Statement
**As a** [type of user/persona]  
**I want** [goal/desire/feature]  
**So that** [benefit/value/reason]

### Example Usage
```
As a registered user
I want to reset my password via email
So that I can regain access to my account if I forget my password
```

---

## Details

### Description
[Detailed description of the feature/requirement. Include any background information, context, or additional details that help understand the story]

### Business Value
[Explain the business value and impact of this story. Why is this important?]

### Assumptions
- [Assumption 1]
- [Assumption 2]
- [Assumption 3]

### Dependencies
- [ ] **Dependency 1:** [Description] - Status: [Blocked/In Progress/Complete]
- [ ] **Dependency 2:** [Description] - Status: [Blocked/In Progress/Complete]

---

## Acceptance Criteria

### Functional Requirements
- [ ] **Given** [precondition]  
      **When** [action]  
      **Then** [expected result]

- [ ] **Given** [precondition]  
      **When** [action]  
      **Then** [expected result]

- [ ] **Given** [precondition]  
      **When** [action]  
      **Then** [expected result]

### Example:
```
✓ Given I am on the login page
  When I click "Forgot Password"
  Then I should see a password reset form

✓ Given I enter a valid email address
  When I submit the reset form
  Then I should receive a confirmation message
  And receive an email with reset instructions
```

### Non-Functional Requirements
- [ ] **Performance:** [Page load < 2 seconds]
- [ ] **Security:** [Data must be encrypted]
- [ ] **Accessibility:** [WCAG 2.1 AA compliant]
- [ ] **Browser Support:** [Chrome, Firefox, Safari, Edge]
- [ ] **Mobile Responsive:** [Works on mobile devices]

---

## Design & Technical Details

### UI/UX Requirements
- **Mockup/Design Link:** [Link to designs]
- **User Flow:** [Link to user flow diagram]
- **Key Interactions:**
  - [Interaction 1]
  - [Interaction 2]

### Technical Approach
```
[High-level technical implementation approach]
```

### API Changes
- **Endpoint:** `[GET/POST/PUT/DELETE] /api/endpoint`
- **Request Body:**
  ```json
  {
    "field1": "value1",
    "field2": "value2"
  }
  ```
- **Response:**
  ```json
  {
    "status": "success",
    "data": {}
  }
  ```

### Database Changes
- [ ] New table: [Table name]
- [ ] New column: [Column details]
- [ ] Migration required: Yes/No

---

## Testing

### Test Scenarios
1. **Happy Path:** [Description of main success scenario]
2. **Edge Case 1:** [Description]
3. **Edge Case 2:** [Description]
4. **Error Case 1:** [Description]
5. **Error Case 2:** [Description]

### Testing Checklist
- [ ] Unit tests written
- [ ] Integration tests written
- [ ] Manual testing completed
- [ ] Cross-browser testing
- [ ] Mobile testing
- [ ] Accessibility testing
- [ ] Performance testing
- [ ] Security testing

---

## Definition of Done

- [ ] Code complete and follows coding standards
- [ ] Code reviewed by at least one team member
- [ ] All acceptance criteria met
- [ ] All tests passing (unit, integration, e2e)
- [ ] Documentation updated
- [ ] No critical or high severity bugs
- [ ] Feature demoed to Product Owner
- [ ] Deployed to staging environment
- [ ] Product Owner approval received

---

## Tasks

### Development Tasks
- [ ] **Backend:** [Task description] - [X hours]
- [ ] **Frontend:** [Task description] - [X hours]
- [ ] **Database:** [Task description] - [X hours]
- [ ] **API:** [Task description] - [X hours]
- [ ] **Testing:** [Task description] - [X hours]
- [ ] **Documentation:** [Task description] - [X hours]

### Sub-tasks Breakdown
```
Total Estimated Hours: [X]
- Development: [X] hours
- Testing: [X] hours
- Code Review: [X] hours
- Documentation: [X] hours
```

---

## Questions & Clarifications

### Open Questions
- ❓ **Question 1:** [Question] - Asked by: [Name] - Status: [Open/Answered]
- ❓ **Question 2:** [Question] - Asked by: [Name] - Status: [Open/Answered]

### Decisions Made
- ✅ **Decision 1:** [Decision] - Made by: [Name] - Date: [Date]
- ✅ **Decision 2:** [Decision] - Made by: [Name] - Date: [Date]

---

## Notes & Comments

### Discussion Points
[Any relevant discussion points from refinement sessions]

### Risks
- ⚠️ **Risk 1:** [Description] - Mitigation: [Strategy]
- ⚠️ **Risk 2:** [Description] - Mitigation: [Strategy]

### Out of Scope
- [Item that is explicitly out of scope]
- [Item that is explicitly out of scope]

---

## References

### Related Stories
- [PROJ-XXX] - [Related story title]
- [PROJ-XXX] - [Related story title]

### Documentation
- [Link to technical documentation]
- [Link to user documentation]
- [Link to API documentation]

### External Resources
- [Link to relevant external resource]
- [Link to relevant external resource]

---

## History

### Story Updates
| Date | Update | Updated By |
|------|--------|------------|
| [Date] | Story created | [Name] |
| [Date] | Acceptance criteria refined | [Name] |
| [Date] | Story points estimated | [Team] |
| [Date] | Moved to sprint | [Name] |

### Status Tracking
- **Created:** [Date]
- **Refined:** [Date]
- **In Progress:** [Date]
- **Code Review:** [Date]
- **Testing:** [Date]
- **Done:** [Date]

---

**Assignee:** [Developer Name]  
**Reviewer:** [Reviewer Name]  
**QA:** [QA Name]  
**Product Owner:** [PO Name]