---
name: User Stories
about: Use this template for user stories submission
title: "C3 Phase 1: User Stories"
labels: []
assignees: ""
---

## Frontend Selection
In two to three sentences, give a description on the frontend you are to build. Is it going to be a Web frontend? A Discord bot? What external packages, libraries, or frameworks would you need?


This project is going to build with a Web frontend using plain JavaScript with external React.js library.




## User Stories + DoDs  
Make sure to follow the *Role, Goal, Benefit* framework for the user stories and the *Given/When/Then* framework for the Definitions of Done! For the DoDs, think about both success and failure scenarios. You can also refer to the examples DoDs in [C3 spec](https://sites.google.com/view/ubc-cpsc310-22w2/project/checkpoint-3).

### User Story 1

As a student, I want look at the general information of a course I would like to take, so that I can get a first view of
the difficulty of the course and finish my course-list.

#### Definitions of Done(s)

Scenario 1: The information of course that student want to view exists.\
Given: The student is on the searching page.\
When: The student enters the dataset id and a course name and clicks search.\
Then: The website gives back the information that the student is searching for.


Scenario 2: The information of course that student want to do not exist.\
Given: The student is on the searching page.\
When: The student enters invalid dataset id or an invalid course name and clicks search\
Then: The website gives back an error and telling the student to try again.


### User Story 2

As a professor, I want to be able to add a Dataset, so that others can find the information of the course.

#### Definitions of Done(s)

Scenario 1: The dataset added successfully.\
Given: The professor is on the admin page\
When: The professor upload a valid zip file with id and press upload button \
Then: The website gives a telling the professor added succeed.

Scenario 2: The add dataset failed\
Given: The professor is on the admin page\
When: The professor upload an invalid zip file  with id and press upload button\
Then: The website gives back an error and telling the professor to check the formation

### Others

You may provide any additional user stories + DoDs in this section for general TA feedback.

But these will not be graded.
