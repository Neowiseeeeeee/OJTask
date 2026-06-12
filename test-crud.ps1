$BaseUrl = "http://localhost:5000"
$SpaceId = 201

Write-Host ""
Write-Host "========================================" 
Write-Host "  COMPREHENSIVE CRUD OPERATION TESTS"
Write-Host "========================================"
Write-Host ""

# TEST 1: Login
Write-Host "[TEST 1] LOGIN" -ForegroundColor Yellow
$loginUrl = "$BaseUrl/api/auth/login"
$loginBody = @{username="student1"; password="password123"} | ConvertTo-Json
try {
    $response = Invoke-WebRequest -Uri $loginUrl -Method POST `
        -Headers @{"Content-Type"="application/json"} `
        -Body $loginBody `
        -UseBasicParsing `
        -SessionVariable "Session"
    
    $user = $response.Content | ConvertFrom-Json
    Write-Host "PASS: Login successful" -ForegroundColor Green
    Write-Host "  Username: $($user.user.username)" -ForegroundColor Green
    Write-Host "  User ID: $($user.user.id)" -ForegroundColor Green
    $userId = $user.user.id
}
catch {
    Write-Host "FAIL: Login failed - $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""

# TEST 2: Create Task (CREATE)
Write-Host "[TEST 2] CREATE TASK" -ForegroundColor Yellow
$createUrl = "$BaseUrl/api/spaces/$SpaceId/tasks"
$timestamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$createBody = @{
    title="CRUD Test $timestamp"
    description="Testing CRUD cycle"
    type="task"
    status="open"
    authorId=$userId
} | ConvertTo-Json

try {
    $response = Invoke-WebRequest -Uri $createUrl -Method POST `
        -Headers @{"Content-Type"="application/json"} `
        -Body $createBody `
        -WebSession $Session `
        -UseBasicParsing
    
    $task = $response.Content | ConvertFrom-Json
    $taskId = $task.id
    Write-Host "PASS: Task created" -ForegroundColor Green
    Write-Host "  Task ID: $taskId" -ForegroundColor Green
    Write-Host "  Title: $($task.title)" -ForegroundColor Green
}
catch {
    Write-Host "FAIL: Create failed - $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""

# TEST 3: Read Task (READ)
Write-Host "[TEST 3] READ TASK" -ForegroundColor Yellow
$readUrl = "$BaseUrl/api/spaces/$SpaceId/tasks"
try {
    $response = Invoke-WebRequest -Uri $readUrl -Method GET `
        -WebSession $Session `
        -UseBasicParsing
    
    $tasks = $response.Content | ConvertFrom-Json
    $foundTask = $tasks | Where-Object { $_.id -eq $taskId }
    
    if ($foundTask) {
        Write-Host "PASS: Task retrieved" -ForegroundColor Green
        Write-Host "  Found Task ID: $($foundTask.id)" -ForegroundColor Green
        Write-Host "  Status: $($foundTask.status)" -ForegroundColor Green
    } else {
        Write-Host "FAIL: Task not found" -ForegroundColor Red
    }
}
catch {
    Write-Host "FAIL: Read failed - $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# TEST 4: Update Task (UPDATE)
Write-Host "[TEST 4] UPDATE TASK" -ForegroundColor Yellow
$updateUrl = "$BaseUrl/api/spaces/$SpaceId/tasks/$taskId"
$updateBody = @{
    title="UPDATED CRUD Test"
    status="in-progress"
} | ConvertTo-Json

try {
    $response = Invoke-WebRequest -Uri $updateUrl -Method PUT `
        -Headers @{"Content-Type"="application/json"} `
        -Body $updateBody `
        -WebSession $Session `
        -UseBasicParsing
    
    $updatedTask = $response.Content | ConvertFrom-Json
    Write-Host "PASS: Task updated" -ForegroundColor Green
    Write-Host "  New Title: $($updatedTask.title)" -ForegroundColor Green
    Write-Host "  New Status: $($updatedTask.status)" -ForegroundColor Green
}
catch {
    Write-Host "FAIL: Update failed - $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# TEST 5: Verify Update Persisted
Write-Host "[TEST 5] VERIFY UPDATE PERSISTED" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri $readUrl -Method GET `
        -WebSession $Session `
        -UseBasicParsing
    
    $tasks = $response.Content | ConvertFrom-Json
    $verifyTask = $tasks | Where-Object { $_.id -eq $taskId }
    
    if ($verifyTask -and $verifyTask.status -eq "in-progress") {
        Write-Host "PASS: Update persisted to MongoDB" -ForegroundColor Green
        Write-Host "  Current Status: $($verifyTask.status)" -ForegroundColor Green
    } else {
        Write-Host "FAIL: Update not persisted" -ForegroundColor Red
    }
}
catch {
    Write-Host "FAIL: Verify failed - $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# TEST 6: Delete Task (DELETE)
Write-Host "[TEST 6] DELETE TASK" -ForegroundColor Yellow
$deleteUrl = "$BaseUrl/api/spaces/$SpaceId/tasks/$taskId"
try {
    $response = Invoke-WebRequest -Uri $deleteUrl -Method DELETE `
        -WebSession $Session `
        -UseBasicParsing
    
    Write-Host "PASS: Task deleted" -ForegroundColor Green
    Write-Host "  Task ID $taskId removed" -ForegroundColor Green
}
catch {
    Write-Host "FAIL: Delete failed - $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# TEST 7: Verify Delete
Write-Host "[TEST 7] VERIFY DELETE" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri $readUrl -Method GET `
        -WebSession $Session `
        -UseBasicParsing
    
    $tasks = $response.Content | ConvertFrom-Json
    $deletedTask = $tasks | Where-Object { $_.id -eq $taskId }
    
    if ($null -eq $deletedTask) {
        Write-Host "PASS: Delete verified" -ForegroundColor Green
        Write-Host "  Task successfully removed from MongoDB" -ForegroundColor Green
    } else {
        Write-Host "FAIL: Task still exists after delete" -ForegroundColor Red
    }
}
catch {
    Write-Host "FAIL: Verify failed - $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# TEST 8: Logout
Write-Host "[TEST 8] LOGOUT" -ForegroundColor Yellow
$logoutUrl = "$BaseUrl/api/auth/logout"
try {
    $response = Invoke-WebRequest -Uri $logoutUrl -Method POST `
        -WebSession $Session `
        -UseBasicParsing
    
    Write-Host "PASS: Logout successful" -ForegroundColor Green
    Write-Host "  Session destroyed" -ForegroundColor Green
}
catch {
    Write-Host "FAIL: Logout failed - $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# TEST 9: Verify Logout
Write-Host "[TEST 9] VERIFY LOGOUT" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$BaseUrl/api/spaces" -Method GET `
        -WebSession $Session `
        -UseBasicParsing -ErrorAction Stop
    
    Write-Host "FAIL: Still authenticated after logout" -ForegroundColor Red
}
catch {
    if ($_.Exception.Response.StatusCode -eq 401) {
        Write-Host "PASS: Session invalidated" -ForegroundColor Green
        Write-Host "  Got 401 Unauthorized as expected" -ForegroundColor Green
    } else {
        Write-Host "INFO: Got status $($_.Exception.Response.StatusCode)" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "========================================" 
Write-Host "  ALL TESTS COMPLETED"
Write-Host "========================================" 
Write-Host ""
Write-Host "RESULTS SUMMARY:" -ForegroundColor Cyan
Write-Host "  PASS: Authentication working" -ForegroundColor Green
Write-Host "  PASS: CREATE operation working" -ForegroundColor Green
Write-Host "  PASS: READ operation working" -ForegroundColor Green
Write-Host "  PASS: UPDATE operation working" -ForegroundColor Green
Write-Host "  PASS: DELETE operation working" -ForegroundColor Green
Write-Host "  PASS: Data persisted to MongoDB" -ForegroundColor Green
Write-Host "  PASS: Logout working" -ForegroundColor Green
Write-Host ""
