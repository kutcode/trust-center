# Basic service health
GET {{api_url}}/health
HTTP 200
[Asserts]
jsonpath "$.status" == "ok"
jsonpath "$.timestamp" exists

# Public trust center settings contract
GET {{api_url}}/api/settings
HTTP 200
[Asserts]
header "content-type" contains "application/json"
jsonpath "$.company_name" exists
jsonpath "$.hero_title" exists
jsonpath "$.primary_color" exists

# Public list contracts
GET {{api_url}}/api/documents
HTTP 200
[Asserts]
header "content-type" contains "application/json"
jsonpath "$" isCollection

GET {{api_url}}/api/certifications
HTTP 200
[Asserts]
header "content-type" contains "application/json"
jsonpath "$" isCollection

GET {{api_url}}/api/security-updates
HTTP 200
[Asserts]
header "content-type" contains "application/json"
jsonpath "$" isCollection

# Error-path contract
GET {{api_url}}/api/access/invalid-smoke-token
HTTP 404
[Asserts]
jsonpath "$.error" exists
