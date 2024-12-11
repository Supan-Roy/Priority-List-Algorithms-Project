const todoValue = document.getElementById("todoText");
const todoAlert = document.getElementById("Alert");
const listItems = document.getElementById("list-items");
const addUpdate = document.getElementById("AddUpdateClick");
const taskCounter = document.getElementById("TaskCounter");
const searchText = document.getElementById("searchText");

let todo = JSON.parse(localStorage.getItem("todo-list")) || [];
let updateIndex = null;

function updateTaskCounter() {
    taskCounter.innerText = `Total Tasks: ${todo.length}`;
}

// Initialize UI with stored items
function ReadToDoItems() {

    todo = mergeSort(todo, (a, b) => {

        if (a.status && !b.status) return 1;
        if (!a.status && b.status) return -1;

        const currentTime = new Date().getTime();
        const timeA = a.deadline ? new Date(a.deadline).getTime() : Infinity;
        const timeB = b.deadline ? new Date(b.deadline).getTime() : Infinity;

        const isOverdueA = !a.status && timeA < currentTime;
        const isOverdueB = !b.status && timeB < currentTime;


        if (isOverdueA && !isOverdueB) return 1;
        if (!isOverdueA && isOverdueB) return -1;


        if (!isOverdueA && !isOverdueB) {
            return timeA - timeB;
        }

        return 0;
    });

    // Clear the UI and re-render tasks
    listItems.innerHTML = "";
    todo.forEach((element, index) => {
        let li = document.createElement("li");

        const countdown = element.status ? "Completed" : getCountdown(element.deadline);
        const deadlineStatus = getDeadlineStatus(element.deadline, element.status);

        const completedStyle = element.status ? "style='text-decoration: line-through'" : "";

        const todoItems = `
            <div class="todo-item-text" ${completedStyle} ondblclick="CompletedToDoItems(${index})">${element.item}</div>
            <div class="todo-item-controls">
                <div class="countdown ${deadlineStatus}">${countdown}</div>
                ${!element.status
                ? `<img class="edit todo-controls" onclick="UpdateToDoItems(${index})" src="./Images/edit.png" />`
                : ""
            }
                <img class="delete todo-controls" onclick="DeleteToDoItems(${index})" src="./Images/delete.png" />
            </div>
        `;

        li.innerHTML = todoItems;
        listItems.appendChild(li);
    });
    updateTaskCounter();
}




// Get the countdown text for each task
function getCountdown(deadline) {
    if (!deadline) return "No deadline";

    const deadlineTime = new Date(deadline).getTime();
    const currentTime = new Date().getTime();
    const timeRemaining = deadlineTime - currentTime;

    if (timeRemaining < 0) {
        return "Overdue";
    }

    const days = Math.floor(timeRemaining / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((timeRemaining % (1000 * 60)) / 1000);

    return `${days}d ${hours}h ${minutes}m ${seconds}s`;
}

function getDeadlineStatus(deadline, status) {
    if (status) {
        return todo.find(task => task.completionStatus === "completed-late") ? "completed-late" : "completed-on-time";
    }

    const deadlineTime = new Date(deadline).getTime();
    const currentTime = new Date().getTime();

    if (currentTime > deadlineTime) {
        return "overdue";
    }
    return "on-time";
}




// Add or update to-do items
function CreateToDoItems() {
    const task = todoValue.value.trim();
    const deadline = document.getElementById("todoDeadline").value;

    if (task === "") {
        setAlertMessage("Please enter your todo text!", "red");
        return;
    }

    if (!deadline) {
        setAlertMessage("Please set a deadline for your task!", "red");
        return;
    }

    if (updateIndex !== null) {
        if (todo.some((el, idx) => el.item === task && idx !== updateIndex)) {
            setAlertMessage("This item already exists!", "red");
            return;
        }
        todo[updateIndex].item = task;
        todo[updateIndex].deadline = deadline;
        setAlertMessage("Todo item updated successfully!", "blue");
        updateIndex = null;
        addUpdate.setAttribute("onclick", "CreateToDoItems()");
        addUpdate.setAttribute("src", "./Images/plus.gif");
    } else {
        if (todo.some((el) => el.item === task)) {
            setAlertMessage("This item already exists!", "red");
            return;
        }
        todo.push({ item: task, deadline, status: false });
        setAlertMessage("Todo item created successfully!", "green");
    }

    todoValue.value = "";
    document.getElementById("todoDeadline").value = "";
    setLocalStorage();
    ReadToDoItems();
}

//countdown refresh

function updateCountdowns() {
    todo.forEach((element, index) => {
        const countdownElement = document.querySelectorAll(".countdown")[index];
        if (countdownElement) {
            if (element.status) {
                countdownElement.innerText = "Completed";
                countdownElement.className = "countdown completed-on-time";
            } else {
                const countdown = getCountdown(element.deadline);
                countdownElement.innerText = countdown;

                const deadlineStatus = getDeadlineStatus(element.deadline, element.status);
                countdownElement.className = `countdown ${deadlineStatus}`;
            }
        }
    });
}

// Initialize countdown updates every second
setInterval(updateCountdowns, 1000);

// Initial call to display countdowns immediately
updateCountdowns();


// Mark item as complete
function CompletedToDoItems(index) {
    const task = todo[index];
    const deadlineTime = new Date(task.deadline).getTime();
    const currentTime = new Date().getTime();

    if (currentTime <= deadlineTime) {
        // Task completed on time
        setAlertMessage(`Task "${task.item}" completed on time!`, "green");
        todo[index].status = true;
        todo[index].completionStatus = "completed-on-time";
    } else {
        // Task completed overdue
        setAlertMessage(`Task "${task.item}" completed with overdue!`, "orange");
        todo[index].status = true;
        todo[index].completionStatus = "completed-late";
    }
    setLocalStorage();
    ReadToDoItems();
}


// Update local storage
function setLocalStorage() {
    localStorage.setItem("todo-list", JSON.stringify(todo));
}


// Prepare item for editing
function UpdateToDoItems(index) {
    todoValue.value = todo[index].item;
    updateIndex = index;
    addUpdate.setAttribute("onclick", "CreateToDoItems()");
    addUpdate.setAttribute("src", "./Images/refresh.png");
    todoValue.focus();
}
//Delete all completed item
function DeleteAllCompletedTasks() {
    const completedTasks = todo.filter((task) => task.status === true);

    if (completedTasks.length === 0) {
        setAlertMessage("No completed tasks available to delete.", "orange");
    } else {
        todo = todo.filter((task) => task.status === false);
        setLocalStorage();
        setAlertMessage("All completed tasks have been deleted.", "red");
        ReadToDoItems();
    }
}

// Delete item
let itemToDelete = null;

// Function to show the modal with the task's name
function DeleteToDoItems(index) {
    itemToDelete = index;
    const item = todo[index];
    const modalMessage = `Are you sure you want to delete "${item.item}"?`;
    document.getElementById("modalMessage").textContent = modalMessage;
    document.getElementById("confirmationModal").style.display = "flex";
}

// Confirm the deletion
function confirmDeleteItem() {
    if (itemToDelete !== null) {
        // Delete the task from the todo array
        todo.splice(itemToDelete, 1);
        setLocalStorage();
        setAlertMessage("Todo item deleted successfully!", "red");
        ReadToDoItems();
        closeModal();
    }
}

// Close the modal without deleting
function closeModal() {
    document.getElementById("confirmationModal").style.display = "none";
    itemToDelete = null;
}


// Search for tasks using binary search
function SearchToDoItems() {
    const query = searchText.value.trim().toLowerCase();

    if (!query) {
        ReadToDoItems();
        return;
    }


    const filteredTasks = todo.filter(item => item.item.toLowerCase().startsWith(query));

    if (filteredTasks.length > 0) {
        listItems.innerHTML = "";
        filteredTasks.forEach(task => {
            const li = document.createElement("li");
            li.textContent = task.item;
            listItems.appendChild(li);
        });
        setAlertMessage(`Tasks starting with "${query}" found!`, "blue");
    } else {
        listItems.innerHTML = "<li>No tasks found!</li>";
        setAlertMessage(`No tasks starting with "${query}"!`, "red");
    }
}


// Sort tasks alphabetically using merge sort
function SortToDoItems() {
    todo = mergeSort(todo, (a, b) => {
        // If one task is completed and the other is not, place completed ones at the bottom
        if (a.status && !b.status) return 1;
        if (!a.status && b.status) return -1;

        // If neither are completed, sort by countdown time
        const timeA = a.deadline ? new Date(a.deadline).getTime() : Infinity;
        const timeB = b.deadline ? new Date(b.deadline).getTime() : Infinity;
        return timeA - timeB;
    });

    setLocalStorage();
    setAlertMessage("Tasks sorted by deadline!", "green");
    ReadToDoItems();
}


// Merge sort algorithm
function mergeSort(array, comparator) {
    if (array.length <= 1) return array;

    const mid = Math.floor(array.length / 2);
    const left = mergeSort(array.slice(0, mid), comparator);
    const right = mergeSort(array.slice(mid), comparator);

    return merge(left, right, comparator);
}

function merge(left, right, comparator) {
    let result = [];
    while (left.length && right.length) {
        if (comparator(left[0], right[0]) <= 0) {
            result.push(left.shift());
        } else {
            result.push(right.shift());
        }
    }
    return [...result, ...left, ...right];
}


// Binary search algorithm
function binarySearch(array, target) {
    let left = 0;
    let right = array.length - 1;

    while (left <= right) {
        const mid = Math.floor((left + right) / 2);

        if (array[mid] === target) return mid;
        else if (array[mid] < target) left = mid + 1;
        else right = mid - 1;
    }

    return -1;
}

// Update local storage
function setLocalStorage() {
    localStorage.setItem("todo-list", JSON.stringify(todo));
}

// Display alert messages
function setAlertMessage(message, color) {
    todoAlert.innerText = message;
    todoAlert.style.color = color;
    todoAlert.classList.remove("toggleMe");
    setTimeout(() => {
        todoAlert.classList.add("toggleMe");
    }, 3000);
}

// Initial call
ReadToDoItems();
