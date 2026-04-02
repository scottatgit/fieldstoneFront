'use client';
import { AnalyticsPanel } from '@/components/platform/AnalyticsPanel';
import { Box,Flex,Text,SimpleGrid,HStack,VStack,Badge,Spinner,Button,Divider,Tooltip,useInterval } from '@chakra-ui/react';
import { useState,useCallback,useEffect } from 'react';

const API=process.env.NEXT_PUBLIC_API_URL||'https://api.fieldstone.pro';
const REFRESH_MS=30000;

interface OpsCount{login_ok:number;login_fail:number;signup_ok:number;signup_fail_captcha:number;signup_fail_email_taken:number;email_sent:number;email_fail:number;turnstile_ok:number;turnstile_fail:number;mfa_ok:number;mfa_fail:number;mfa_recovery:number;workspace_created:number;workspace_blocked_unverified:number;email_verify_ok:number;}
interface OpsRate{login_success_rate:number|null;login_fail_per_min:number;signup_success_rate:number|null;turnstile_fail_rate:number|null;mfa_success_rate:number|null;}
interface OpsSummary{ok:boolean;window_min:number;event_count:number;ts:string;counts:OpsCount;rates:OpsRate;}
interface OpsAlert{rule:string;severity:'critical'|'warning';title:string;message:string;metric:string;}
interface OpsAlerts{ok:boolean;ts:string;alert_count:number;critical_count:number;warning_count:number;triggered:boolean;alerts:OpsAlert[];}
interface HealthCheck{ok:boolean;status:number|null;detail:string;[k:string]:unknown}
interface OpsHealth{ok:boolean;status:string;ts:string;checks:{turnstile:HealthCheck;resend:HealthCheck;database:HealthCheck;config:HealthCheck&{cookie_domain:string;cookie_domain_ok:boolean}};} 
interface SmokeResult{name:string;pass:boolean;status_code:number|null;detail:string;ts:string}
interface SmokeReport{ok:boolean;passed:number;total:number;ts:string;results:SmokeResult[]}

async function apiFetch<T>(path:string,opts:RequestInit={}):Promise<T>{
  const res=await fetch(`${API}${path}`,{credentials:'include',...opts});
  if(!res.ok){const e=await res.json().catch(()=>({detail:res.statusText}));throw new Error((e as{detail?:string}).detail??'fetch_error');}
  return res.json();
}

function Panel({title,children,action}:{title:string;children:React.ReactNode;action?:React.ReactNode}){
  return(
    <Box bg='gray.900' border='1px solid' borderColor='gray.800' borderRadius='md' overflow='hidden'>
      <Flex px={4} py={3} align='center' justify='space-between' borderBottom='1px solid' borderColor='gray.800'>
        <Text fontSize='xs' fontFamily='mono' fontWeight='black' letterSpacing='widest' textTransform='uppercase' color='orange.400'>{title}</Text>
        {action}
      </Flex>
      <Box p={4}>{children}</Box>
    </Box>
  );
}

function StatCell({label,value,color='white',sub}:{label:string;value:number|string;color?:string;sub?:string}){
  return(
    <Box p={3} bg='gray.950' borderRadius='sm' border='1px solid' borderColor='gray.800'>
      <Text fontSize='xl' fontWeight='black' color={color} lineHeight={1} mb={1}>{value}</Text>
      <Text fontSize='10px' fontFamily='mono' color='gray.500' textTransform='uppercase' letterSpacing='wider'>{label}</Text>
      {sub&&<Text fontSize='9px' color='gray.600' mt={0.5}>{sub}</Text>}
    </Box>
  );
}

function Rate({value}:{value:number|null|undefined}){
  if(value==null)return <Text as='span' color='gray.600'>&#8212;</Text>;
  const pct=Math.round(value*100);
  const color=pct>=90?'green.400':pct>=70?'yellow.400':'red.400';
  return <Text as='span' color={color} fontWeight='bold'>{pct}%</Text>;
}

function SevBadge({sev}:{sev:string}){
  return <Badge colorScheme={sev==='critical'?'red':'yellow'} fontSize='9px' fontFamily='mono' letterSpacing='wider' textTransform='uppercase' px={2} py={0.5}>{sev}</Badge>;
}

function HDot({ok}:{ok:boolean}){
  return <Box w={2} h={2} borderRadius='full' bg={ok?'green.400':'red.400'} flexShrink={0}/>;
}

function MetricsPanel({summary,loading}:{summary:OpsSummary|null;loading:boolean}){
  if(loading)return <Panel title='System Metrics'><Flex justify='center' py={6}><Spinner color='orange.400' size='sm'/></Flex></Panel>;
  const c=summary?.counts;
  const r=summary?.rates;
  return(
    <Panel title={`System Metrics · last ${summary?.window_min??5} min`}>
      <VStack spacing={4} align='stretch'>
        <Text fontSize='10px' fontFamily='mono' color='gray.600' textTransform='uppercase'>Auth</Text>
        <SimpleGrid columns={3} gap={2}>
          <StatCell label='Login OK' value={c?.login_ok??0} color='green.400'/>
          <StatCell label='Login Fail' value={c?.login_fail??0} color={c?.login_fail?'red.400':'gray.500'}/>
          <StatCell label='Fail/min' value={r?.login_fail_per_min?.toFixed(1)??'0'} color={Number(r?.login_fail_per_min)>=10?'red.400':'white'}/>
        </SimpleGrid>
        <SimpleGrid columns={2} gap={2}>
          <StatCell label='MFA OK' value={c?.mfa_ok??0} color='green.400' sub={`fail:${c?.mfa_fail??0} recovery:${c?.mfa_recovery??0}`}/>
          <StatCell label='Email Verify OK' value={c?.email_verify_ok??0}/>
        </SimpleGrid>
        <Divider borderColor='gray.800'/>
        <Text fontSize='10px' fontFamily='mono' color='gray.600' textTransform='uppercase'>Signup</Text>
        <SimpleGrid columns={3} gap={2}>
          <StatCell label='Signup OK' value={c?.signup_ok??0} color='green.400'/>
          <StatCell label='Captcha Fail' value={c?.signup_fail_captcha??0} color={c?.signup_fail_captcha?'yellow.400':'gray.500'}/>
          <StatCell label='Email Taken' value={c?.signup_fail_email_taken??0}/>
        </SimpleGrid>
        <SimpleGrid columns={2} gap={2}>
          <StatCell label='Workspace Created' value={c?.workspace_created??0} color='green.400'/>
          <StatCell label='Blocked Unverified' value={c?.workspace_blocked_unverified??0} color={c?.workspace_blocked_unverified?'yellow.400':'gray.500'}/>
        </SimpleGrid>
        <Divider borderColor='gray.800'/>
        <Text fontSize='10px' fontFamily='mono' color='gray.600' textTransform='uppercase'>Email &amp; Captcha</Text>
        <SimpleGrid columns={4} gap={2}>
          <StatCell label='Email Sent' value={c?.email_sent??0} color='green.400'/>
          <StatCell label='Email Fail' value={c?.email_fail??0} color={c?.email_fail?'red.400':'gray.500'}/>
          <StatCell label='Turnstile OK' value={c?.turnstile_ok??0}/>
          <StatCell label='Turnstile Fail' value={c?.turnstile_fail??0} color={c?.turnstile_fail?'yellow.400':'gray.500'}/>
        </SimpleGrid>
        <Divider borderColor='gray.800'/>
        <Text fontSize='10px' fontFamily='mono' color='gray.600' textTransform='uppercase'>Rates</Text>
        <SimpleGrid columns={3} gap={3}>
          <Box><Text fontSize='10px' color='gray.500' fontFamily='mono' mb={1}>LOGIN SUCCESS</Text><Rate value={r?.login_success_rate}/></Box>
          <Box><Text fontSize='10px' color='gray.500' fontFamily='mono' mb={1}>SIGNUP SUCCESS</Text><Rate value={r?.signup_success_rate}/></Box>
          <Box><Text fontSize='10px' color='gray.500' fontFamily='mono' mb={1}>MFA SUCCESS</Text><Rate value={r?.mfa_success_rate}/></Box>
        </SimpleGrid>
        {summary&&<Text fontSize='9px' color='gray.700' fontFamily='mono'>{summary.event_count} events · refreshed {new Date(summary.ts).toLocaleTimeString()}</Text>}
      </VStack>
    </Panel>
  );
}

function AlertsPanel({data,loading}:{data:OpsAlerts|null;loading:boolean}){
  if(loading)return <Panel title='Active Alerts'><Flex justify='center' py={6}><Spinner color='orange.400' size='sm'/></Flex></Panel>;
  const title=data?`Active Alerts · ${data.critical_count}C ${data.warning_count}W`:'Active Alerts';
  return(
    <Panel title={title}>
      {!data?.triggered?(
        <Flex align='center' gap={2} py={2}>
          <Box w={2} h={2} borderRadius='full' bg='green.400'/>
          <Text fontSize='sm' color='green.400' fontFamily='mono'>All clear &#8212; no active alerts</Text>
        </Flex>
      ):(
        <VStack spacing={3} align='stretch'>
          {data.alerts.map((al,i)=>(
            <Box key={i} p={3} bg='gray.950' borderRadius='sm' border='1px solid' borderColor={al.severity==='critical'?'red.900':'yellow.900'}>
              <HStack mb={1} justify='space-between'>
                <HStack spacing={2}><SevBadge sev={al.severity}/><Text fontSize='xs' fontWeight='bold' color='white'>{al.title}</Text></HStack>
                <Text fontSize='10px' fontFamily='mono' color={al.severity==='critical'?'red.300':'yellow.300'}>{al.metric}</Text>
              </HStack>
              <Text fontSize='xs' color='gray.400'>{al.message}</Text>
            </Box>
          ))}
        </VStack>
      )}
      {data&&<Text mt={3} fontSize='9px' color='gray.700' fontFamily='mono'>evaluated at {new Date(data.ts).toLocaleTimeString()}</Text>}
    </Panel>
  );
}

function HealthPanel({data,loading}:{data:OpsHealth|null;loading:boolean}){
  if(loading)return <Panel title='Dependency Health'><Flex justify='center' py={6}><Spinner color='orange.400' size='sm'/></Flex></Panel>;
  const checks=data?.checks;
  const rows:[string,HealthCheck|undefined][]=[['Turnstile',checks?.turnstile],['Resend Email',checks?.resend],['Database',checks?.database],['Config / JWT',checks?.config]];
  return(
    <Panel title={`Dependency Health · ${data?.status??'—'}`}>
      <VStack spacing={0} align='stretch'>
        {rows.map(([name,chk])=>(
          <Flex key={name} align='center' justify='space-between' py={3} borderBottom='1px solid' borderColor='gray.800' _last={{borderBottom:'none'}}>
            <HStack spacing={3}><HDot ok={chk?.ok??false}/><Text fontSize='sm' fontFamily='mono' color='white'>{name}</Text></HStack>
            <HStack spacing={3}>
              {chk?.status!=null&&<Text fontSize='10px' fontFamily='mono' color='gray.500'>HTTP {chk.status}</Text>}
              <Tooltip label={chk?.detail??''} placement='left' fontSize='xs'>
                <Text fontSize='xs' color={chk?.ok?'green.400':'red.400'} cursor='help' fontFamily='mono'>{chk?.ok?'OK':'FAIL'}</Text>
              </Tooltip>
            </HStack>
          </Flex>
        ))}
        {checks?.config&&<Text fontSize='9px' fontFamily='mono' color='gray.600' pt={2}>cookie_domain: {checks.config.cookie_domain} · {checks.config.cookie_domain_ok?'✓ correct':'✗ WRONG'}</Text>}
        {data&&<Text fontSize='9px' color='gray.700' fontFamily='mono' pt={1}>checked {new Date(data.ts).toLocaleTimeString()}</Text>}
      </VStack>
    </Panel>
  );
}

function SmokePanel(){
  const [report,setReport]=useState<SmokeReport|null>(null);
  const [running,setRunning]=useState(false);
  const [err,setErr]=useState<string|null>(null);
  const run=useCallback(async()=>{
    setRunning(true);setErr(null);
    try{const data=await apiFetch<SmokeReport>('/api/admin/run-smoke',{method:'POST'});setReport(data);}
    catch(e:unknown){setErr(e instanceof Error?e.message:'unknown error');}
    finally{setRunning(false);}
  },[]);
  return(
    <Panel title='Smoke Test Runner' action={
      <Button size='xs' colorScheme='orange' variant='outline' onClick={run} isLoading={running} loadingText='Running...' fontFamily='mono' letterSpacing='wider'>RUN CHECKS</Button>
    }>
      {!report&&!running&&!err&&<Text fontSize='xs' color='gray.600' fontFamily='mono'>No results yet &#8212; press RUN CHECKS</Text>}
      {err&&<Text fontSize='xs' color='red.400' fontFamily='mono'>{err}</Text>}
      {report&&(
        <VStack spacing={0} align='stretch'>
          <HStack mb={3}>
            <Badge colorScheme={report.ok?'green':'red'} fontFamily='mono' fontSize='10px'>{report.passed}/{report.total} PASSED</Badge>
            <Text fontSize='9px' fontFamily='mono' color='gray.600'>{new Date(report.ts).toLocaleTimeString()}</Text>
          </HStack>
          {report.results.map((r,i)=>(
            <Flex key={i} align='flex-start' gap={3} py={2} borderBottom='1px solid' borderColor='gray.800' _last={{borderBottom:'none'}}>
              <Box w={2} h={2} mt={1} borderRadius='full' bg={r.pass?'green.400':'red.400'} flexShrink={0}/>
              <Box flex={1}>
                <Text fontSize='xs' fontFamily='mono' color={r.pass?'white':'red.300'}>{r.name}</Text>
                <Text fontSize='10px' color='gray.500' mt={0.5}>{r.detail}</Text>
              </Box>
              {r.status_code!=null&&<Text fontSize='10px' fontFamily='mono' color='gray.600' flexShrink={0}>HTTP {r.status_code}</Text>}
            </Flex>
          ))}
        </VStack>
      )}
    </Panel>
  );
}

export default function OpsPage(){
  const [summary,setSummary]=useState<OpsSummary|null>(null);
  const [alerts,setAlerts]=useState<OpsAlerts|null>(null);
  const [health,setHealth]=useState<OpsHealth|null>(null);
  const [loadingMetrics,setLoadingMetrics]=useState(true);
  const [loadingAlerts,setLoadingAlerts]=useState(true);
  const [loadingHealth,setLoadingHealth]=useState(true);
  const [lastRefresh,setLastRefresh]=useState<Date|null>(null);

  const refresh=useCallback(async()=>{
    const [s,al,h]=await Promise.allSettled([
      apiFetch<OpsSummary>('/api/admin/ops/summary'),
      apiFetch<OpsAlerts>('/api/admin/ops/alerts'),
      apiFetch<OpsHealth>('/api/admin/ops/health'),
    ]);
    if(s.status==='fulfilled'){setSummary(s.value);setLoadingMetrics(false);}
    if(al.status==='fulfilled'){setAlerts(al.value);setLoadingAlerts(false);}
    if(h.status==='fulfilled'){setHealth(h.value);setLoadingHealth(false);}
    setLastRefresh(new Date());
  },[]);

  useEffect(()=>{refresh();},[refresh]);
  useInterval(refresh,REFRESH_MS);

  const critCount=alerts?.critical_count??0;
  const healthOk=health?.ok??true;

  return(
    <Box px={{base:4,md:6}} py={6} maxW='1400px' mx='auto'>
      <Flex mb={6} align='center' justify='space-between'>
        <VStack align='flex-start' spacing={0}>
          <HStack spacing={3}>
            <Text fontSize='lg' fontWeight='black' fontFamily='mono' color='white'>OPS CONSOLE</Text>
            {critCount>0&&<Badge colorScheme='red' fontSize='10px' fontFamily='mono' px={2}>{critCount} CRITICAL</Badge>}
            {critCount===0&&healthOk&&<Badge colorScheme='green' fontSize='10px' fontFamily='mono' px={2}>ALL SYSTEMS OK</Badge>}
          </HStack>
          <Text fontSize='xs' color='gray.600' fontFamily='mono'>
            {'platform_admin · auto-refresh 30s'}
            {lastRefresh&&` · last ${lastRefresh.toLocaleTimeString()}`}
          </Text>
        </VStack>
        <Button size='xs' variant='ghost' color='gray.500' fontFamily='mono' onClick={refresh}>↺ REFRESH</Button>
      </Flex>
      <SimpleGrid columns={{base:1,xl:2}} gap={4} mb={4}>
        <MetricsPanel summary={summary} loading={loadingMetrics}/>
        <VStack spacing={4} align='stretch'>
          <AlertsPanel data={alerts} loading={loadingAlerts}/>
          <HealthPanel data={health} loading={loadingHealth}/>
        </VStack>
      </SimpleGrid>
      <SmokePanel/>
      {/* FST-AN-001E: First-party analytics readout */}
      <Box mt={4}><AnalyticsPanel /></Box>
    </Box>
  );
}
