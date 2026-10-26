// Array to store loaded users in memory
let storedUsers = [];

// DOM Element references
const loadUsersBtn = document.getElementById('load-users');
const filterInput = document.getElementById('filter-input');
const statusMessage = document.getElementById('status');
const usersList = document.getElementById('users-list');

/**
 * Fetches users from an external API using async/await and try/catch/finally
 */
async function loadUsers() {
  statusMessage.textContent = 'Loading users...';
  usersList.innerHTML = '';

  try {
    const response = await fetch('https://jsonplaceholder.typicode.com/users');
    
    if (!response.ok) {
      throw new Error(`HTTP error status: ${response.status}`);
    }

    storedUsers = await response.json();
    renderUsers(storedUsers);
  } catch (error) {
    statusMessage.textContent = `Failed to load users: ${error.message}`;
  } finally {
    if (storedUsers.length > 0) {
      statusMessage.textContent = `Successfully loaded ${storedUsers.length} users.`;
    }
  }
}

/**
 * Renders an array of users into the HTML list
 * @param {Array} list - Array of user objects to display
 */
function renderUsers(list) {
  usersList.innerHTML = '';

  if (list.length === 0) {
    statusMessage.textContent = 'No users match your filter.';
    return;
  }

  statusMessage.textContent = `Displaying ${list.length} user(s).`;

  list.forEach(user => {
    const li = document.createElement('li');
    li.textContent = `${user.name} (${user.email})`;
    usersList.appendChild(li);
  });
}

// Event Listeners
loadUsersBtn.addEventListener('click', loadUsers);

filterInput.addEventListener('input', (event) => {
  const query = event.target.value.toLowerCase().trim();

  const filtered = storedUsers.filter(user => 
    user.name.toLowerCase().includes(query) || 
    user.email.toLowerCase().includes(query)
  );

  renderUsers(filtered);
});