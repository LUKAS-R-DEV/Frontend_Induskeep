<script>
import {onMount} from 'svelte';
let user=null

onMount(()=>{
 const stored=localStorage.getItem('user')
 if(stored){
  try{
    user=JSON.parse(stored)
  }catch(e){
    user=null
  }
  }
 }
)
</script>



<nav class="navbar">
  <div class="logo"><i class="fas fa-industry"></i>INDUSKEEP</div>
  <div class="user-info">
    <i class="fas fa-user-circle"></i>
    <span>{user?user.name:"Usuario"}</span>
  </div>
</nav>




<style>
  .navbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem;
    background:white;
    color: black;
  }

  .logo {
    font-weight: bold;
    font-size: 1.8rem;
  }
  .user-info {
    font-size: 1.5rem;
    display: flex;
    align-items: center;
    gap: .5rem;
  }
</style>
