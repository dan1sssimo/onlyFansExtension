<!-- eslint-disable no-undef -->
<template>
  <div class="main_app">
    <div class="my-button">
      <label class="switch">
        <input type="checkbox" id="myButton" @click="[buttonClick()]" />
        <span class="slider round"></span>
      </label>
      <!-- <button id="myButton" class="my-button__button" @click="[buttonClick()]">
        {{ statusText == true ? "ON" : "OFF" }}
      </button> -->
      <!-- <div class="test">
        <div class="spinner"></div>
      </div> -->
    </div>
  </div>
</template>

<script>
import {} from "vue";
import { buttonClick } from "../entry/popup";
export default {
  name: "popupView",
  setup() {
    return { buttonClick };
  },
};
</script>

<style>
.test {
  padding: 6px;
  margin-right: 4px;
}
.main_app {
  font-family: "Avenir", Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
}
.my-button {
  margin: 10px auto;
}
.my-button__button {
  margin: 0 auto;
  border: none;
  padding: 8px 18px;
  font-size: 14px;
  line-height: 20px;
  color: #fefefe;
  background: #00aff0;
  min-width: 78px;
  transition: opacity 0.15s ease, background-color 0.15s ease,
    box-shadow 0.15s ease;
  display: inline-block;
  text-align: center;
  text-transform: uppercase;
  border-radius: 1000px;
}
.my-button__button:hover {
  background: #0094ca;
  cursor: pointer;
}
.spinner {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 3.8px solid;
  border-color: #dbdcef;
  border-right-color: #c0c0c0;
  animation: spinner-d3wgkg 1.2s infinite linear;
}

@keyframes spinner-d3wgkg {
  to {
    transform: rotate(1turn);
  }
}
.switch {
  position: relative;
  display: inline-block;
  width: 60px;
  height: 34px;
}

/* Hide default HTML checkbox */
.switch input {
  display: none;
}

/* The slider */
.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  -webkit-transition: 0.4s;
  transition: 0.4s;
}

.slider:before {
  position: absolute;
  content: "";
  height: 26px;
  width: 26px;
  left: 4px;
  bottom: 4px;
  background-color: white;
  -webkit-transition: 0.4s;
  transition: 0.4s;
}

input:checked + .slider {
  background-color: #2196f3;
}

input:focus + .slider {
  box-shadow: 0 0 1px #2196f3;
}

input:checked + .slider:before {
  -webkit-transform: translateX(26px);
  -ms-transform: translateX(26px);
  transform: translateX(26px);
}

/* Rounded sliders */
.slider.round {
  border-radius: 34px;
}

.slider.round:before {
  border-radius: 50%;
}
</style>
