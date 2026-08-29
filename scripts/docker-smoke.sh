#!/bin/sh
set -eu

image_name="${1:-calendar-foundation:smoke}"
container_name="calendar-foundation-smoke"
volume_name="calendar-foundation-smoke-data"
container_port="4321"

cleanup() {
  docker rm -f "$container_name" >/dev/null 2>&1 || true
  docker volume rm "$volume_name" >/dev/null 2>&1 || true
}

wait_until_ready() {
  attempt=0
  until docker exec "$container_name" node -e "Promise.all([fetch('http://127.0.0.1:$container_port/api/health'),fetch('http://127.0.0.1:$container_port/book')]).then(async ([api,spa])=>{if(!api.ok||!spa.ok||!(await spa.text()).includes('<div id=\"root\"></div>'))process.exit(1)}).catch(()=>process.exit(1))"; do
    attempt=$((attempt + 1))
    if [ "$attempt" -ge 20 ]; then
      docker logs "$container_name"
      exit 1
    fi
    sleep 1
  done
}

trap cleanup EXIT
cleanup

docker volume create "$volume_name" >/dev/null
docker run -d --name "$container_name" -e PORT="$container_port" -v "$volume_name:/data" "$image_name" >/dev/null
wait_until_ready

booking_id="$(docker exec "$container_name" node --input-type=module -e "const base='http://127.0.0.1:$container_port';const availability=await fetch(base+'/api/meeting-types/consultation/availability').then(response=>response.json());const slot=availability.dates.flatMap(date=>date.slots).find(item=>item.status==='available');if(!slot)throw new Error('No available slot for smoke booking');const response=await fetch(base+'/api/bookings',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({meetingTypeId:'consultation',startsAt:slot.startsAt,guest:{name:'Docker Smoke',email:'docker-smoke@example.com'}})});if(response.status!==201)throw new Error('Booking failed: '+response.status+' '+await response.text());const booking=await response.json();process.stdout.write(booking.id)")"
docker rm -f "$container_name" >/dev/null
docker run -d --name "$container_name" -e PORT="$container_port" -v "$volume_name:/data" "$image_name" >/dev/null
wait_until_ready
docker exec "$container_name" node --input-type=module -e "const bookings=await fetch('http://127.0.0.1:$container_port/api/bookings/upcoming').then(response=>response.json());if(!bookings.some(booking=>booking.id==='$booking_id'&&booking.guest.email==='docker-smoke@example.com'))process.exit(1)"
